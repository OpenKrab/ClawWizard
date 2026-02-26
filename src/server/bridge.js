import http from "http";
import { spawn, exec, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const PORT = 18790; // Bridge port (OpenClaw gateway default is 18789)
const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const CONFIG_PATH = path.join(OPENCLAW_DIR, "openclaw.json");
const ENV_PATH = path.join(OPENCLAW_DIR, ".env");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");

// Models cache (5 min TTL)
let modelsCache = { data: null, ts: 0 };

// Ensure directories exist
if (!fs.existsSync(OPENCLAW_DIR))
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
if (!fs.existsSync(WORKSPACE_DIR))
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

// Auth choice map: provider slug -> openclaw onboard --auth-choice value
const AUTH_CHOICE_MAP = {
  anthropic: "apiKey",
  openai: "apiKey",
  google: "gemini-api-key",
  gemini: "gemini-api-key",
  xai: "xai-api-key",
  opencode: "opencode-zen",
  "vercel-ai-gateway": "ai-gateway-api-key",
  "cloudflare-ai-gateway": "cloudflare-ai-gateway-api-key",
  moonshot: "moonshot-api-key",
  synthetic: "synthetic-api-key",
  mistral: "mistral-api-key",
  // Providers that authenticate via .env only (no dedicated CLI flag)
  kilocode: "skip",
  openrouter: "skip",
  groq: "skip",
  deepseek: "skip",
  together: "skip",
  venice: "skip",
  minimax: "skip",
  ollama: "skip",
  vllm: "skip",
};

// Provider => ENV key mapping
const ENV_KEY_MAP = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  gemini: "GEMINI_API_KEY",
  xai: "XAI_API_KEY",
  opencode: "OPENCODE_API_KEY",
  "vercel-ai-gateway": "AI_GATEWAY_API_KEY",
  "cloudflare-ai-gateway": "CLOUDFLARE_AI_GATEWAY_API_KEY",
  moonshot: "MOONSHOT_API_KEY",
  synthetic: "SYNTHETIC_API_KEY",
  mistral: "MISTRAL_API_KEY",
  kilocode: "KILO_API_KEY",
};

function isOpenclawInstalled() {
  try {
    execSync("openclaw --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // ─── POST /api/deploy ─────────────────────────────────────────
  if (req.url === "/api/deploy" && req.method === "POST") {
    try {
      const {
        config,
        env,
        soulMd,
        provider,
        apiKey,
        gatewayPort,
        gatewayBind,
        useNonInteractive,
        injected,
        workspaceFiles,
      } = await parseBody(req);

      const steps = [];

      // ── Step 1: Write openclaw.json ────────────────────────────
      // Ensure gateway.mode is "local" (required by OpenClaw)
      // Sanitize bind value: map old IPs to correct enum
      let resolvedBind = gatewayBind || config.gateway?.bind || "loopback";
      const bindMap = {
        "127.0.0.1": "loopback",
        localhost: "loopback",
        "0.0.0.0": "lan",
      };
      resolvedBind = bindMap[resolvedBind] || resolvedBind;

      const finalConfig = {
        ...config,
        gateway: {
          ...config.gateway,
          mode: "local",
          port: gatewayPort || config.gateway?.port || 18789,
          bind: resolvedBind,
        },
      };

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(finalConfig, null, 2));
      steps.push("✅ Wrote openclaw.json to " + CONFIG_PATH);

      // ── Step 2: Write .env (API keys) ──────────────────────────
      let envContent = "";
      const providerSlug = (provider || "").toLowerCase();
      const envKeyName = ENV_KEY_MAP[providerSlug];

      if (envKeyName && apiKey) {
        envContent += `${envKeyName}=${apiKey}\n`;
      }

      // Add any additional env vars
      for (const [key, val] of Object.entries(env || {})) {
        if (key !== envKeyName && val) {
          envContent += `${key}=${val}\n`;
        }
      }

      if (envContent) {
        fs.writeFileSync(ENV_PATH, envContent);
        steps.push("✅ Wrote .env with API credentials");
      }

      // ── Step 3: Write SOUL.md to workspace ─────────────────────
      const workspacePath =
        finalConfig.agents?.defaults?.workspace?.replace("~", os.homedir()) ||
        WORKSPACE_DIR;
      const resolvedWorkspace = path.isAbsolute(workspacePath)
        ? workspacePath
        : path.resolve(workspacePath);

      if (!fs.existsSync(resolvedWorkspace)) {
        fs.mkdirSync(resolvedWorkspace, { recursive: true });
      }

      // ── Step 3: Write workspace files ────────────────────────
      // Use resolvedWorkspace (already calculated above as path.resolve(workspacePath))

      // Write soulMd (legacy support)
      if (soulMd && !workspaceFiles?.["SOUL.md"]) {
        fs.writeFileSync(path.join(resolvedWorkspace, "SOUL.md"), soulMd);
        steps.push("✅ Wrote SOUL.md to " + resolvedWorkspace);
      }

      // Write all files from workspaceFiles
      if (workspaceFiles && typeof workspaceFiles === "object") {
        for (const [filename, content] of Object.entries(workspaceFiles)) {
          if (content) {
            fs.writeFileSync(path.join(resolvedWorkspace, filename), content);
            steps.push(`✅ Wrote ${filename} to workspace`);
          }
        }
      } else if (injected) {
        // Fallback to legacy injected structure
        const injectedFilesMapping = {
          "IDENTITY.md": injected.identity,
          "USER.md": injected.user,
          "TOOLS.md": injected.tools,
          "AGENTS.md": injected.agents,
          "HEARTBEAT.md": injected.heartbeat,
        };

        for (const [filename, content] of Object.entries(
          injectedFilesMapping,
        )) {
          if (content) {
            fs.writeFileSync(path.join(resolvedWorkspace, filename), content);
            steps.push(`✅ Wrote ${filename} to workspace`);
          }
        }
      }

      // ── Step 4: Check if OpenClaw CLI is installed ─────────────
      if (!isOpenclawInstalled()) {
        steps.push("⚠️ OpenClaw CLI not found. Please install it first:");
        steps.push("   npm install -g openclaw@latest");
        steps.push(
          "📄 Config files have been written. Run 'openclaw onboard' manually after installing.",
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: true,
            message:
              "Config written, but OpenClaw CLI not found. Install it and run: openclaw onboard",
            steps,
            needsManual: true,
          }),
        );
      }

      // ── Step 5: Use openclaw onboard --non-interactive OR gateway lifecycle ──
      if (useNonInteractive) {
        // Build the non-interactive onboard command
        const authChoice = AUTH_CHOICE_MAP[providerSlug] || "skip";
        const args = [
          "onboard",
          "--non-interactive",
          "--accept-risk",
          "--mode",
          "local",
          "--gateway-port",
          String(finalConfig.gateway.port),
          "--gateway-bind",
          finalConfig.gateway.bind,
        ];

        // Add auth choice flags
        if (authChoice !== "skip") {
          args.push("--auth-choice", authChoice);

          // Map provider-specific key flags
          if (providerSlug === "anthropic" && apiKey) {
            args.push("--anthropic-api-key", apiKey);
          } else if (providerSlug === "openai" && apiKey) {
            args.push("--openai-api-key", apiKey);
          } else if (
            (providerSlug === "google" || providerSlug === "gemini") &&
            apiKey
          ) {
            args.push("--gemini-api-key", apiKey);
          } else if (providerSlug === "xai" && apiKey) {
            args.push("--xai-api-key", apiKey);
          } else if (providerSlug === "moonshot" && apiKey) {
            args.push("--moonshot-api-key", apiKey);
          } else if (providerSlug === "synthetic" && apiKey) {
            args.push("--synthetic-api-key", apiKey);
          } else if (providerSlug === "mistral" && apiKey) {
            args.push("--mistral-api-key", apiKey);
          } else if (providerSlug === "opencode" && apiKey) {
            args.push("--opencode-zen-api-key", apiKey);
          } else if (providerSlug === "vercel-ai-gateway" && apiKey) {
            args.push("--ai-gateway-api-key", apiKey);
          }
        } else {
          args.push("--auth-choice", "skip");
        }

        steps.push("🚀 Running: openclaw " + args.join(" "));

        const child = spawn("openclaw", args, { stdio: "pipe", shell: true });
        let stdout = "",
          stderr = "";

        child.stdout.on("data", (d) => (stdout += d.toString()));
        child.stderr.on("data", (d) => (stderr += d.toString()));

        child.on("close", (code) => {
          if (code === 0) {
            steps.push("✅ openclaw onboard completed successfully!");
            if (stdout) steps.push(stdout);
          } else {
            // Onboard may fail at gateway connection — that's OK, config was written
            const output = stderr || stdout;
            if (
              output.includes("Config overwrite") ||
              output.includes("Config write")
            ) {
              steps.push(
                "✅ Config written successfully (onboard gateway step skipped)",
              );
            } else {
              steps.push("⚠️ openclaw onboard exited with code " + code);
            }
            if (output) steps.push(output);
          }

          // Always try to start the gateway after onboard
          steps.push("🔧 Starting gateway...");
          exec(
            "openclaw gateway start",
            { shell: true },
            (startErr, startOut, startStderr) => {
              if (startErr) {
                // Try just running the gateway directly
                steps.push(
                  "⚠️ Gateway start: " +
                    (startStderr || startErr.message || "failed"),
                );
                steps.push("💡 Try starting manually: openclaw gateway start");
              } else {
                steps.push("✅ Gateway started!");
                if (startOut) steps.push(startOut.trim());
              }

              // Health check
              exec(
                "openclaw gateway health --json",
                { shell: true },
                (hErr, hOut) => {
                  if (!hErr) {
                    steps.push("✅ Gateway health check passed!");
                    steps.push("🖥️ Opening Dashboard and TUI...");
                    exec("openclaw dashboard", { shell: true });
                    exec("start cmd /c openclaw tui", { shell: true });
                  } else {
                    steps.push(
                      "⚠️ Gateway not reachable yet — it may still be starting up",
                    );
                    steps.push("💡 Run: openclaw doctor");
                  }

                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: true, // Config was written, that's the main goal
                      message: steps.join("\n"),
                      steps,
                    }),
                  );
                },
              );
            },
          );
        });

        child.on("error", (err) => {
          steps.push("❌ Failed to run openclaw onboard: " + err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, error: err.message, steps }),
          );
        });
        return; // Response will be sent in callback
      }

      // ── Fallback: gateway install → start ──────────────────────
      steps.push("🔧 Installing gateway daemon...");

      exec("openclaw gateway install --json", (installErr, installOut) => {
        if (installErr) {
          steps.push("⚠️ gateway install: " + (installErr.message || "failed"));
        } else {
          steps.push("✅ Gateway daemon installed");
        }

        // Try restart first, then start
        exec("openclaw gateway restart --json", (restartErr) => {
          if (restartErr) {
            exec("openclaw gateway start --json", (startErr, startOut) => {
              if (startErr) {
                steps.push("⚠️ Gateway start failed: " + startErr.message);
                steps.push("💡 Try running manually: openclaw gateway start");
              } else {
                steps.push("✅ Gateway started successfully!");
              }

              // Health check
              exec("openclaw gateway health --json", (hErr, hOut) => {
                if (!hErr) {
                  steps.push("✅ Gateway health check passed");
                  steps.push("🖥️ Opening Dashboard and TUI...");
                  exec("openclaw dashboard", { shell: true });
                  exec("start cmd /c openclaw tui", { shell: true });
                } else {
                  steps.push(
                    "⚠️ Gateway health check: " +
                      (hErr.message || "not reachable yet"),
                  );
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: true,
                    message: steps.join("\n"),
                    steps,
                  }),
                );
              });
            });
          } else {
            steps.push("✅ Gateway restarted successfully!");

            exec("openclaw gateway health --json", (hErr) => {
              if (!hErr) {
                steps.push("✅ Gateway health check passed");
                steps.push("🖥️ Opening Dashboard and TUI...");
                exec("openclaw dashboard", { shell: true });
                exec("start cmd /c openclaw tui", { shell: true });
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  success: true,
                  message: steps.join("\n"),
                  steps,
                }),
              );
            });
          }
        });
      });
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }

    // ─── GET /api/logs ────────────────────────────────────────────
  } else if (req.url === "/api/logs" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Use openclaw gateway call logs.tail for real-time logs
    const child = spawn("openclaw", ["logs", "--follow", "--plain"], {
      shell: true,
    });

    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        res.write(`data: ${JSON.stringify({ type: "stdout", msg: line })}\n\n`);
      }
    });

    child.stderr.on("data", (data) => {
      res.write(
        `data: ${JSON.stringify({ type: "stderr", msg: data.toString() })}\n\n`,
      );
    });

    child.on("error", () => {
      res.write(
        `data: ${JSON.stringify({ type: "error", msg: "Failed to start log stream" })}\n\n`,
      );
    });

    req.on("close", () => child.kill());

    // ─── GET /api/status ──────────────────────────────────────────
  } else if (req.url === "/api/status" && req.method === "GET") {
    exec("openclaw gateway status --json", (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      try {
        const parsed = JSON.parse(stdout);
        res.end(JSON.stringify({ online: true, ...parsed }));
      } catch {
        res.end(
          JSON.stringify({
            online: !err,
            output: stdout || stderr || "Unknown status",
            installed: isOpenclawInstalled(),
          }),
        );
      }
    });

    // ─── GET /api/health ──────────────────────────────────────────
  } else if (req.url === "/api/health" && req.method === "GET") {
    exec("openclaw gateway health --json", (err, stdout) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ healthy: !err, output: stdout || "" }));
    });

    // ─── GET /api/doctor ──────────────────────────────────────────
  } else if (req.url === "/api/doctor" && req.method === "GET") {
    exec("openclaw doctor --json", (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output: stdout || stderr }));
    });

    // ─── GET /api/channels ────────────────────────────────────────
  } else if (req.url === "/api/channels" && req.method === "GET") {
    exec("openclaw channels list --json", (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      try {
        res.end(stdout);
      } catch {
        res.end(JSON.stringify({ error: stderr || "Failed to list channels" }));
      }
    });

    // ─── POST /api/channels/login ─────────────────────────────────
  } else if (req.url === "/api/channels/login" && req.method === "POST") {
    const { channel, token } = await parseBody(req);

    if (!channel) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "channel is required" }));
    }

    const args = ["channels", "add", "--channel", channel];
    if (token) args.push("--token", token);

    exec(`openclaw ${args.join(" ")}`, (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: !err,
          output: stdout || stderr,
        }),
      );
    });

    // ─── POST /api/pairing/approve ────────────────────────────────
  } else if (req.url === "/api/pairing/approve" && req.method === "POST") {
    const { channel, code } = await parseBody(req);

    exec(
      `openclaw pairing approve ${channel} ${code} --notify`,
      (err, stdout, stderr) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: !err,
            output: stdout || stderr,
          }),
        );
      },
    );

    // ─── GET /api/pairing/list ────────────────────────────────────
  } else if (req.url?.startsWith("/api/pairing/list") && req.method === "GET") {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const channel = url.searchParams.get("channel") || "";

    exec(`openclaw pairing list ${channel} --json`, (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      try {
        res.end(stdout);
      } catch {
        res.end(JSON.stringify({ error: stderr || "Failed" }));
      }
    });
    // ─── GET /api/models ──────────────────────────────────────────
    // Fetches ALL models once, caches 5 min, groups by provider.
    // Providers are auto-detected from model IDs (e.g. "opencode/xxx" → provider="opencode")
  } else if (req.url?.startsWith("/api/models") && req.method === "GET") {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const now = Date.now();

    // Cache: reuse if < 5 min old
    if (!forceRefresh && modelsCache.data && now - modelsCache.ts < 300000) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(modelsCache.data));
    }

    exec(
      "openclaw models list --all",
      { shell: true, timeout: 30000 },
      (err, stdout) => {
        const models = [];

        if (!err && stdout) {
          const lines = stdout.split("\n").filter(Boolean);
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(/\s{2,}/).map((s) => s.trim());
            if (parts.length < 2) continue;
            const id = parts[0];
            models.push({
              id,
              provider: id.split("/")[0] || "unknown",
              input: parts[1] || "text",
              context: parts[2] || "-",
              local: parts[3] === "yes",
              auth: parts[4] === "yes",
              tags: parts[5] || "",
              free: id.includes(":free") || id.includes("-free"),
            });
          }
        }

        // Also try ollama if installed
        exec("ollama list", { shell: true, timeout: 10000 }, (oErr, oOut) => {
          if (!oErr && oOut) {
            const oLines = oOut.split("\n").filter(Boolean);
            for (let i = 1; i < oLines.length; i++) {
              const parts = oLines[i]
                .split(/\s{2,}/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (parts.length < 1) continue;
              const name = parts[0].replace(":latest", "");
              // Don't add duplicates
              const ollamaId = `ollama/${name}`;
              if (!models.find((m) => m.id === ollamaId)) {
                models.push({
                  id: ollamaId,
                  provider: "ollama",
                  input: "text",
                  context: "-",
                  local: true,
                  auth: true,
                  tags: "",
                  free: true,
                  size: parts[2] || "-",
                });
              }
            }
          }

          // Group by provider
          const byProvider = {};
          for (const m of models) {
            if (!byProvider[m.provider]) byProvider[m.provider] = [];
            byProvider[m.provider].push(m);
          }

          // Build providers summary
          const providers = Object.entries(byProvider)
            .map(([name, items]) => ({
              id: name,
              count: items.length,
              authed: items.filter((m) => m.auth).length,
              freeCount: items.filter((m) => m.free).length,
            }))
            .sort((a, b) => b.authed - a.authed); // authed providers first

          const result = {
            models,
            byProvider,
            providers,
            total: models.length,
            authed: models.filter((m) => m.auth).length,
          };

          // Cache it
          modelsCache = { data: result, ts: Date.now() };

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        });
      },
    );
    // ─── 404 ──────────────────────────────────────────────────────
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`🦞 ClawWizard Bridge running on http://localhost:${PORT}`);
  console.log(`   OpenClaw CLI installed: ${isOpenclawInstalled()}`);
  console.log(`   Config dir: ${OPENCLAW_DIR}`);
});
