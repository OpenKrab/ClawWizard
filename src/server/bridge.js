import http from "http";
import { spawn, exec, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { Client } from "ssh2";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 18790; // Bridge port (OpenClaw gateway default is 18789)
const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const CONFIG_PATH = path.join(OPENCLAW_DIR, "openclaw.json");
const ENV_PATH = path.join(OPENCLAW_DIR, ".env");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");

// Models cache (5 min TTL)
let modelsCache = { data: null, ts: 0 };

// Active interactive auth process
let activeAuthProcess = null;

// OAuth/interactive auth choices that need browser
const INTERACTIVE_AUTH_CHOICES = new Set([
  "openai-codex",
  "github-copilot",
  "chutes",
  "google-gemini-cli",
  "minimax-portal",
  "qwen-portal",
  "copilot-proxy",
]);

// Deep merge utility — merges source into target without overwriting nested objects
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

// Auth choice → CLI API key flag mapping
// Maps each authChoice ID to the correct --xxx-api-key CLI flag
const AUTH_KEY_FLAGS = {
  apiKey: "--anthropic-api-key",
  "openai-api-key": "--openai-api-key",
  "gemini-api-key": "--gemini-api-key",
  "moonshot-api-key": "--moonshot-api-key",
  "moonshot-api-key-cn": "--moonshot-api-key",
  "kimi-code-api-key": "--kimi-code-api-key",
  "xai-api-key": "--xai-api-key",
  "mistral-api-key": "--mistral-api-key",
  "openrouter-api-key": "--openrouter-api-key",
  "kilocode-api-key": "--kilocode-api-key",
  "synthetic-api-key": "--synthetic-api-key",
  "venice-api-key": "--venice-api-key",
  "together-api-key": "--together-api-key",
  "huggingface-api-key": "--huggingface-api-key",
  "litellm-api-key": "--litellm-api-key",
  "ai-gateway-api-key": "--ai-gateway-api-key",
  "cloudflare-ai-gateway-api-key": "--cloudflare-ai-gateway-api-key",
  "opencode-zen": "--opencode-zen-api-key",
  "zai-api-key": "--zai-api-key",
  "zai-coding-global": "--zai-api-key",
  "zai-coding-cn": "--zai-api-key",
  "zai-global": "--zai-api-key",
  "zai-cn": "--zai-api-key",
  "xiaomi-api-key": "--xiaomi-api-key",
  "minimax-api": "--minimax-api-key",
  "minimax-api-key-cn": "--minimax-api-key",
  "minimax-api-lightning": "--minimax-api-key",
  "qianfan-api-key": "--qianfan-api-key",
  "volcengine-api-key": "--volcengine-api-key",
  "byteplus-api-key": "--byteplus-api-key",
  "custom-api-key": "--custom-api-key",
};

// Ensure directories exist
if (!fs.existsSync(OPENCLAW_DIR))
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
if (!fs.existsSync(WORKSPACE_DIR))
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

// Auth choice map: provider slug -> openclaw onboard --auth-choice value
const AUTH_CHOICE_MAP = {
  anthropic: "apiKey",
  openai: "openai-api-key",
  google: "gemini-api-key",
  gemini: "gemini-api-key",
  xai: "xai-api-key",
  opencode: "opencode-zen",
  "vercel-ai-gateway": "ai-gateway-api-key",
  "cloudflare-ai-gateway": "cloudflare-ai-gateway-api-key",
  moonshot: "moonshot-api-key",
  synthetic: "synthetic-api-key",
  mistral: "mistral-api-key",
  zai: "zai-api-key",
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
  zai: "ZAI_API_KEY",
  "vercel-ai-gateway": "AI_GATEWAY_API_KEY",
  "cloudflare-ai-gateway": "CLOUDFLARE_AI_GATEWAY_API_KEY",
  moonshot: "MOONSHOT_API_KEY",
  synthetic: "SYNTHETIC_API_KEY",
  mistral: "MISTRAL_API_KEY",
  kilocode: "KILO_API_KEY",
};

const getOpenclawCommand = () => {
  // 1. Try simple command
  try {
    execSync("openclaw --version", { stdio: "pipe" });
    return "openclaw";
  } catch {
    // 2. Fallback for Windows (Global npm path)
    if (process.platform === "win32") {
      const globalPath = path.join(
        process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
        "npm",
        "openclaw.cmd",
      );
      if (fs.existsSync(globalPath)) return `"${globalPath}"`;
    }
    // 3. Fallback for Unix
    const unixPaths = [
      "/usr/local/bin/openclaw",
      "/usr/bin/openclaw",
      path.join(os.homedir(), ".npm-global/bin/openclaw"),
    ];
    for (const p of unixPaths) {
      if (fs.existsSync(p)) return p;
    }

    return "openclaw"; // Last resort
  }
};

function isOpenclawInstalled() {
  try {
    const cmd = getOpenclawCommand();
    execSync(`${cmd} --version`, { stdio: "pipe" });
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

function checkGatewayHealthWithRetry(
  { attempts = 8, delayMs = 2500 } = {},
  callback,
) {
  let tries = 0;

  const cmd = getOpenclawCommand();
  const run = () => {
    exec(
      `${cmd} gateway health --json`,
      { shell: true },
      (err, stdout, stderr) => {
        if (!err) return callback(null, stdout || "");
        tries += 1;
        if (tries >= attempts) return callback(err, stdout || stderr || "");
        setTimeout(run, delayMs);
      },
    );
  };

  run();
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
        authChoice: reqAuthChoice,
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

      // Read existing config to preserve fields that wizard doesn't manage
      // (e.g. meta, wizard, browser, auth sections written by prior onboard runs)
      let existingConfig = {};
      try {
        if (fs.existsSync(CONFIG_PATH)) {
          existingConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        }
      } catch {
        // If existing config is corrupt, start fresh
        existingConfig = {};
      }

      const finalConfig = deepMerge(existingConfig, {
        ...config,
        gateway: {
          ...config.gateway,
          mode: "local",
          port: gatewayPort || config.gateway?.port || 18789,
          bind: resolvedBind,
        },
      });

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

      const cmd = getOpenclawCommand();
      // ── Step 4: Check if OpenClaw CLI is installed ─────────────
      if (!isOpenclawInstalled()) {
        steps.push("⚠️ OpenClaw CLI not found. Please install it first:");
        steps.push("   npm install -g openclaw@latest");
        steps.push(
          `📄 Config files have been written. Run '${cmd} onboard' manually after installing.`,
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: true,
            message: `Config written, but OpenClaw CLI not found. Install it and run: ${cmd} onboard`,
            steps,
            needsManual: true,
          }),
        );
      }

      // ── Step 5: Use openclaw onboard --non-interactive OR gateway lifecycle ──
      if (useNonInteractive) {
        // Build the non-interactive onboard command
        const authChoice =
          reqAuthChoice || AUTH_CHOICE_MAP[providerSlug] || "skip";
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
          "--skip-channels",
          "--skip-skills",
          "--skip-health",
        ];

        // Add auth choice flags using lookup table
        if (authChoice !== "skip") {
          args.push("--auth-choice", authChoice);

          // Find the correct --xxx-api-key flag for this auth choice
          const keyFlag = AUTH_KEY_FLAGS[authChoice];
          if (keyFlag && apiKey) {
            args.push(keyFlag, apiKey);
          }
        } else {
          args.push("--auth-choice", "skip");
        }

        const cmd = getOpenclawCommand();
        steps.push("🚀 Running: " + cmd + " " + args.join(" "));

        const child = spawn(cmd.replace(/"/g, ""), args, {
          stdio: "pipe",
          shell: true,
        });
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

          const cmd2 = getOpenclawCommand();
          // Always try to start the gateway after onboard
          steps.push("🔧 Starting gateway...");
          exec(
            `${cmd2} gateway start`,
            { shell: true },
            (startErr, startOut, startStderr) => {
              if (startErr) {
                // Try just running the gateway directly
                steps.push(
                  "⚠️ Gateway start: " +
                    (startStderr || startErr.message || "failed"),
                );
                steps.push(`💡 Try starting manually: ${cmd2} gateway start`);
              } else {
                steps.push("✅ Gateway started!");
                if (startOut) steps.push(startOut.trim());
              }

              // Health check with retries; auto-repair once if needed.
              checkGatewayHealthWithRetry({}, (hErr) => {
                if (!hErr) {
                  steps.push("✅ Gateway health check passed!");
                  steps.push("🖥️ Opening Dashboard and TUI...");
                  const cmd = getOpenclawCommand();
                  exec(`${cmd} dashboard`, { shell: true });
                  exec(`start cmd /c ${cmd} tui`, { shell: true });
                  res.writeHead(200, { "Content-Type": "application/json" });
                  return res.end(
                    JSON.stringify({
                      success: true,
                      message: steps.join("\n"),
                      steps,
                    }),
                  );
                }

                const cmd = getOpenclawCommand();
                steps.push("⚠️ Gateway still unreachable after retries.");
                steps.push(`🩺 Running: ${cmd} doctor --fix`);
                exec(
                  `${cmd} doctor --fix`,
                  { shell: true },
                  (dErr, dOut, dStderr) => {
                    if (dOut) steps.push(dOut.trim());
                    if (dErr && dStderr) steps.push(dStderr.trim());

                    const cmdDoctor = getOpenclawCommand();
                    steps.push("🔁 Restarting gateway after doctor fix...");
                    exec(
                      `${cmdDoctor} gateway restart`,
                      { shell: true },
                      (rErr, rOut, rStderr) => {
                        if (rOut) steps.push(rOut.trim());
                        if (rErr && rStderr) steps.push(rStderr.trim());

                        checkGatewayHealthWithRetry({}, (hErr2) => {
                          if (!hErr2) {
                            steps.push("✅ Gateway recovered and healthy!");
                            steps.push("🖥️ Opening Dashboard and TUI...");
                            exec(`${cmdDoctor} dashboard`, { shell: true });
                            exec(`start cmd /c ${cmdDoctor} tui`, {
                              shell: true,
                            });
                          } else {
                            steps.push(
                              `⚠️ Gateway not reachable yet — check logs with: ${cmdDoctor} logs --follow --plain`,
                            );
                            steps.push(`💡 Run: ${cmdDoctor} doctor`);
                          }

                          res.writeHead(200, {
                            "Content-Type": "application/json",
                          });
                          res.end(
                            JSON.stringify({
                              success: true, // Config was written, that's the main goal
                              message: steps.join("\n"),
                              steps,
                            }),
                          );
                        });
                      },
                    );
                  },
                );
              });
            },
          );
        });

        child.on("error", (err) => {
          const cmdErr = getOpenclawCommand();
          steps.push(`❌ Failed to run ${cmdErr} onboard: ` + err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, error: err.message, steps }),
          );
        });
        return; // Response will be sent in callback
      }

      // ── Fallback: gateway install → start ──────────────────────
      steps.push("🔧 Installing gateway daemon...");
      const cmdFallback = getOpenclawCommand();

      exec(
        `${cmdFallback} gateway install --json`,
        (installErr, installOut) => {
          if (installErr) {
            steps.push(
              "⚠️ gateway install: " + (installErr.message || "failed"),
            );
          } else {
            steps.push("✅ Gateway daemon installed");
          }

          // Try restart first, then start
          exec(`${cmdFallback} gateway restart --json`, (restartErr) => {
            if (restartErr) {
              exec(
                `${cmdFallback} gateway start --json`,
                (startErr, startOut) => {
                  if (startErr) {
                    steps.push("⚠️ Gateway start failed: " + startErr.message);
                    steps.push(
                      `💡 Try running manually: ${cmdFallback} gateway start`,
                    );
                  } else {
                    steps.push("✅ Gateway started successfully!");
                  }

                  // Health check
                  exec(`${cmdFallback} gateway health --json`, (hErr, hOut) => {
                    if (!hErr) {
                      steps.push("✅ Gateway health check passed");
                      steps.push("🖥️ Opening Dashboard and TUI...");
                      exec(`${cmdFallback} dashboard`, { shell: true });
                      exec(`start cmd /c ${cmdFallback} tui`, { shell: true });
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
                },
              );
            } else {
              steps.push("✅ Gateway restarted successfully!");

              exec(`${cmdFallback} gateway health --json`, (hErr) => {
                if (!hErr) {
                  steps.push("✅ Gateway health check passed");
                  steps.push("🖥️ Opening Dashboard and TUI...");
                  exec(`${cmdFallback} dashboard`, { shell: true });
                  exec(`start cmd /c ${cmdFallback} tui`, { shell: true });
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
        },
      );
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
    const cmdLogs = getOpenclawCommand();
    const child = spawn(
      cmdLogs.replace(/"/g, ""),
      ["logs", "--follow", "--plain"],
      {
        shell: true,
      },
    );

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
    const cmd = getOpenclawCommand();
    exec(`${cmd} gateway status --json`, (err, stdout, stderr) => {
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
    const cmd = getOpenclawCommand();
    exec(`${cmd} gateway health --json`, (err, stdout) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ healthy: !err, output: stdout || "" }));
    });

    // ─── GET /api/doctor ──────────────────────────────────────────
  } else if (req.url === "/api/doctor" && req.method === "GET") {
    const cmd = getOpenclawCommand();
    exec(`${cmd} doctor --json`, (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output: stdout || stderr }));
    });

    // ─── GET /api/channels ────────────────────────────────────────
  } else if (req.url === "/api/channels" && req.method === "GET") {
    const cmd = getOpenclawCommand();
    exec(`${cmd} channels list --json`, (err, stdout, stderr) => {
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

    const cmd = getOpenclawCommand();
    const args = ["channels", "add", "--channel", channel];
    if (token) args.push("--token", token);

    exec(`${cmd} ${args.join(" ")}`, (err, stdout, stderr) => {
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
    const cmdPair = getOpenclawCommand();

    exec(
      `${cmdPair} pairing approve ${channel} ${code} --notify`,
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

    // ─── POST /api/pairing/test ─────────────────────────────────
  } else if (req.url === "/api/pairing/test" && req.method === "POST") {
    const { channel, message } = await parseBody(req);
    const cmdTest = getOpenclawCommand();

    // Send a test message to trigger pairing code generation
    const testMessage =
      message || "Hello! This is a test message to generate pairing code.";

    exec(
      `${cmdTest} message send --channel ${channel} --message "${testMessage}"`,
      (err, stdout, stderr) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: !err,
            output: stdout || stderr,
            message: err
              ? "Failed to send test message"
              : "Test message sent successfully",
          }),
        );
      },
    );

    // ─── GET /api/pairing/list ────────────────────────────────────
  } else if (req.url?.startsWith("/api/pairing/list") && req.method === "GET") {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const channel = url.searchParams.get("channel") || "";
    const cmdList = getOpenclawCommand();

    exec(`${cmdList} pairing list ${channel} --json`, (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      try {
        res.end(stdout);
      } catch {
        res.end(JSON.stringify({ error: stderr || "Failed" }));
      }
    });

    // ─── POST /api/auth-start (SSE) ────────────────────────────────
  } else if (req.url === "/api/auth-start" && req.method === "POST") {
    const { authChoice } = await parseBody(req);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Kill any existing auth process
    if (activeAuthProcess) {
      try {
        activeAuthProcess.kill();
      } catch {}
      activeAuthProcess = null;
    }

    const cmd = getOpenclawCommand();
    const args = [
      "onboard",
      "--auth-choice",
      authChoice,
      "--mode",
      "local",
      "--accept-risk",
      "--skip-channels",
      "--skip-skills",
      "--skip-health",
      "--skip-ui",
    ];

    const sendEvent = (data) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {}
    };

    sendEvent({
      type: "log",
      msg: `\uD83D\uDD10 Starting ${authChoice} authentication...`,
    });
    sendEvent({
      type: "log",
      msg: `\uD83D\uDE80 Running: ${cmd} ${args.join(" ")}`,
    });

    const child = spawn(cmd.replace(/"/g, ""), args, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    });

    activeAuthProcess = child;

    const processOutput = (data, streamType) => {
      const text = data.toString();
      const lines = text.split("\n").filter(Boolean);
      for (const line of lines) {
        // Strip ANSI escape codes
        const clean = line
          .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")
          .replace(/\x1B\][^\x07]*\x07/g, "")
          .trim();
        if (!clean) continue;

        sendEvent({ type: streamType, msg: clean });

        // Detect URLs for user to open in browser
        const urlMatch = clean.match(/https?:\/\/[^\s"'<>]+/);
        if (urlMatch) {
          sendEvent({ type: "url", url: urlMatch[0] });
        }
      }
    };

    child.stdout.on("data", (data) => processOutput(data, "stdout"));
    child.stderr.on("data", (data) => processOutput(data, "stderr"));

    child.on("close", (code) => {
      activeAuthProcess = null;
      sendEvent({
        type: "done",
        success: code === 0,
        msg:
          code === 0
            ? "\u2705 Authentication completed successfully!"
            : `\u26A0\uFE0F Auth process exited with code ${code}`,
      });
      res.end();
    });

    child.on("error", (err) => {
      activeAuthProcess = null;
      sendEvent({
        type: "error",
        msg: `\u274C Failed to start auth: ${err.message}`,
      });
      res.end();
    });

    req.on("close", () => {
      if (activeAuthProcess === child) {
        try {
          child.kill();
        } catch {}
        activeAuthProcess = null;
      }
    });

    // ─── POST /api/auth-input ──────────────────────────────────────
  } else if (req.url === "/api/auth-input" && req.method === "POST") {
    const { input } = await parseBody(req);
    if (activeAuthProcess && activeAuthProcess.stdin) {
      try {
        activeAuthProcess.stdin.write(input + "\n");
      } catch {}
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));

    // ─── POST /api/auth-cancel ─────────────────────────────────────
  } else if (req.url === "/api/auth-cancel" && req.method === "POST") {
    if (activeAuthProcess) {
      try {
        activeAuthProcess.kill();
      } catch {}
      activeAuthProcess = null;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));

    // ─── POST /api/deploy-remote ──────────────────────────────────
  } else if (req.url === "/api/deploy-remote" && req.method === "POST") {
    try {
      const {
        sshConfig, // { host, port, username, password, privateKey }
        config,
        env,
        workspaceFiles,
        provider,
        apiKey,
      } = await parseBody(req);

      const steps = [];
      const conn = new Client();

      res.writeHead(200, { "Content-Type": "application/json" });

      conn
        .on("ready", () => {
          steps.push("✅ SSH Connection established");

          const runRemote = (cmd) => {
            return new Promise((resolve, reject) => {
              conn.exec(cmd, (err, stream) => {
                if (err) return reject(err);
                let out = "";
                stream
                  .on("close", (code) => resolve({ code, out }))
                  .on("data", (data) => (out += data))
                  .stderr.on("data", (data) => (out += data));
              });
            });
          };

          (async () => {
            try {
              // 1. Check/Install OpenClaw
              steps.push("🔍 Checking for OpenClaw CLI on remote...");
              const vCheck = await runRemote("openclaw --version");
              if (vCheck.code !== 0) {
                steps.push("📦 Installing OpenClaw CLI on remote...");
                await runRemote("npm install -g openclaw@latest");
              }

              // 2. Prepare directories
              await runRemote("mkdir -p ~/.openclaw/workspace");

              // 3. Write Config Files
              // (Using base64 to avoid escaping issues with special characters in config)
              const configB64 = Buffer.from(JSON.stringify(config)).toString(
                "base64",
              );
              await runRemote(
                `echo "${configB64}" | base64 -d > ~/.openclaw/openclaw.json`,
              );
              steps.push("✅ Uploaded openclaw.json");

              // .env
              let envContent = "";
              const providerSlug = (provider || "").toLowerCase();
              const envKeyName = ENV_KEY_MAP[providerSlug];
              if (envKeyName && apiKey)
                envContent += `${envKeyName}=${apiKey}\n`;
              for (const [k, v] of Object.entries(env || {}))
                if (v) envContent += `${k}=${v}\n`;

              const envB64 = Buffer.from(envContent).toString("base64");
              await runRemote(
                `echo "${envB64}" | base64 -d > ~/.openclaw/.env`,
              );
              steps.push("✅ Uploaded .env");

              // Workspace files
              if (workspaceFiles) {
                for (const [name, content] of Object.entries(workspaceFiles)) {
                  const b64 = Buffer.from(content).toString("base64");
                  await runRemote(
                    `echo "${b64}" | base64 -d > ~/.openclaw/workspace/${name}`,
                  );
                  steps.push(`✅ Uploaded ${name}`);
                }
              }

              // 4. Onboard
              steps.push("🚀 Bootstrapping OpenClaw on remote...");
              const onboardCmd = `openclaw onboard --non-interactive --accept-risk --mode local --gateway-port ${config.gateway?.port || 18789}`;
              const onboardResult = await runRemote(onboardCmd);
              steps.push(onboardResult.out);

              // 5. Start
              steps.push("🔧 Starting Gateway on remote...");
              await runRemote("openclaw gateway start");

              const health = await runRemote("openclaw gateway health --json");
              if (health.code === 0) {
                steps.push("🎉 Remote deployment successful! Agent is LIVE.");
              } else {
                steps.push(
                  "⚠️ Gateway started but health check failed. Please check remote logs.",
                );
              }

              res.end(JSON.stringify({ success: true, steps }));
              conn.end();
            } catch (err) {
              steps.push(`❌ Remote Error: ${err.message}`);
              res.end(
                JSON.stringify({ success: false, steps, error: err.message }),
              );
              conn.end();
            }
          })();
        })
        .on("error", (err) => {
          res.end(
            JSON.stringify({
              success: false,
              error: `SSH Connect Error: ${err.message}`,
            }),
          );
        })
        .connect(sshConfig);
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
  } else if (req.url.startsWith("/api/models") && req.method === "GET") {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const now = Date.now();

    // Cache: reuse if < 5 min old
    if (!forceRefresh && modelsCache.data && now - modelsCache.ts < 300000) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(modelsCache.data));
    }

    const cmd = getOpenclawCommand();
    const modelsPath = path.join(__dirname, "..", "data", "all_models.json");

    // Helper to read JSON without BOM
    const readModelsSeed = () => {
      try {
        if (fs.existsSync(modelsPath)) {
          const raw = fs
            .readFileSync(modelsPath, "utf8")
            .replace(/^\uFEFF/, "");
          const parsed = JSON.parse(raw);
          const list = parsed.models || (Array.isArray(parsed) ? parsed : []);
          return {
            models: list.map((m) => ({
              id: m.key || m.id,
              provider: (m.key || m.id || "").split("/")[0] || "unknown",
              input: m.input || "text",
              context: m.contextWindow
                ? `${Math.round(m.contextWindow / 1024)}k`
                : "-",
              local: !!m.local,
              auth: !!m.available,
              tags: (m.tags || []).join(", "),
              free:
                (m.key || "").includes(":free") ||
                (m.key || "").includes("-free"),
            })),
            fromSeed: true,
          };
        }
      } catch (e) {
        console.error("[Bridge] Seed read error:", e.message);
      }
      return null;
    };

    // Unified fetch logic
    const fetchModels = (callback) => {
      // 1. Fetch OpenClaw Models (Live or Seed)
      exec(
        `${cmd} models list --all --json`,
        { shell: true, timeout: 30000 },
        (err, stdout) => {
          let openClawModels = [];
          let rawData = null;

          if (!err && stdout) {
            try {
              rawData = JSON.parse(stdout.replace(/^\uFEFF/, ""));
            } catch (e) {
              console.error("JSON Parse Error for models:", e.message);
            }
          }

          const dataToParse = rawData || readModelsSeed();
          if (dataToParse) {
            if (dataToParse.fromSeed) {
              openClawModels = dataToParse.models;
            } else {
              const list =
                dataToParse.models ||
                (Array.isArray(dataToParse) ? dataToParse : []);
              openClawModels = list.map((m) => ({
                id: m.key || m.id,
                provider: (m.key || m.id || "").split("/")[0] || "unknown",
                input: m.input || "text",
                context: m.contextWindow
                  ? `${Math.round(m.contextWindow / 1024)}k`
                  : "-",
                local: !!m.local,
                auth: !!m.available,
                tags: (m.tags || []).join(", "),
                free:
                  (m.key || "").includes(":free") ||
                  (m.key || "").includes("-free"),
              }));
            }
          }

          // 2. Fetch Ollama Models
          exec("ollama list", { shell: true, timeout: 10000 }, (oErr, oOut) => {
            const finalModels = [...openClawModels];
            if (!oErr && oOut) {
              const oLines = oOut.split("\n").filter(Boolean);
              for (let i = 1; i < oLines.length; i++) {
                const parts = oLines[i]
                  .split(/\s{2,}/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (parts.length < 1) continue;
                const name = parts[0].replace(":latest", "");
                const ollamaId = `ollama/${name}`;
                if (!finalModels.find((m) => m.id === ollamaId)) {
                  finalModels.push({
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

            // 3. Post-process and group
            const byProvider = {};
            finalModels.forEach((m) => {
              if (!byProvider[m.provider]) byProvider[m.provider] = [];
              byProvider[m.provider].push(m);
            });

            const providers = Object.entries(byProvider)
              .map(([name, items]) => ({
                id: name,
                count: items.length,
                authed: items.filter((m) => m.auth).length,
                freeCount: items.filter((m) => m.free).length,
              }))
              .sort((a, b) => b.authed - a.authed || b.count - a.count);

            const result = {
              models: finalModels,
              byProvider,
              providers,
              total: finalModels.length,
              authed: finalModels.filter((m) => m.auth).length,
              live: !!rawData,
              ollamaLive: !oErr,
            };

            callback(result);
          });
        },
      );
    };

    // Fast path: serve seed + background update
    if (!forceRefresh) {
      const seed = readModelsSeed();
      if (seed && seed.models.length > 0) {
        // Just return seed + empty ollama check for now, or fetch ollama fast
        exec("ollama list", { shell: true, timeout: 5000 }, (oErr, oOut) => {
          let merged = [...seed.models];
          if (!oErr && oOut) {
            const oLines = oOut.split("\n").filter(Boolean);
            for (let i = 1; i < oLines.length; i++) {
              const parts = oLines[i]
                .split(/\s{2,}/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (parts.length < 1) continue;
              const name = parts[0].replace(":latest", "");
              const oid = `ollama/${name}`;
              if (!merged.find((m) => m.id === oid)) {
                merged.push({
                  id: oid,
                  provider: "ollama",
                  input: "text",
                  context: "-",
                  local: true,
                  auth: true,
                  tags: "",
                  free: true,
                });
              }
            }
          }
          const resObj = {
            models: merged,
            providers: [],
            total: merged.length,
            fromSeed: true,
          };
          // Minimal provider summary for seed
          const provs = {};
          merged.forEach((m) => {
            provs[m.provider] = true;
          });
          resObj.providers = Object.keys(provs).map((p) => ({
            id: p,
            count: merged.filter((x) => x.provider === p).length,
          }));

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(resObj));

          // Background full update
          fetchModels((fullRes) => {
            modelsCache = { data: fullRes, ts: Date.now() };
          });
        });
        return;
      }
    }

    // Slow path: full fetch
    fetchModels((result) => {
      modelsCache = { data: result, ts: Date.now() };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    });
    // ─── GET /api/check-system ────────────────────────────────────
  } else if (req.url === "/api/check-system" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    const result = {
      node: {
        installed: true,
        version: process.version,
      },
      openclaw: {
        installed: isOpenclawInstalled(),
        version: null,
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
      },
    };

    if (result.openclaw.installed) {
      try {
        const cmd = getOpenclawCommand();
        const v = execSync(`${cmd} -V`, { encoding: "utf8" }).trim();
        result.openclaw.version = v;
      } catch (e) {
        result.openclaw.version = "unknown";
      }
    }

    res.end(JSON.stringify(result));

    // ─── POST /api/install-openclaw ───────────────────────────────
  } else if (req.url === "/api/install-openclaw" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    exec("npm install -g openclaw@latest", (err, stdout, stderr) => {
      res.end(
        JSON.stringify({
          success: !err,
          output: stdout || stderr,
        }),
      );
    });

    // ─── 404 ──────────────────────────────────────────────────────
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  const cmd = getOpenclawCommand();
  console.log(`🦞 ClawWizard Bridge running on http://localhost:${PORT}`);
  console.log(`   OpenClaw CLI installed: ${isOpenclawInstalled()}`);
  console.log(`   Command path: ${cmd}`);
  console.log(`   Config dir: ${OPENCLAW_DIR}`);
});
