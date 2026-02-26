import http from "http";
import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const PORT = 18790;
const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const CONFIG_PATH = path.join(OPENCLAW_DIR, "openclaw.json");
const ENV_PATH = path.join(OPENCLAW_DIR, ".env");

// Ensure directory exists
if (!fs.existsSync(OPENCLAW_DIR)) {
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/deploy" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { config, env, soulMd } = JSON.parse(body);

        // 1. Write openclaw.json
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        // 2. Write .env
        let envContent = "";
        for (const [key, val] of Object.entries(env || {})) {
          envContent += `${key}=${val}\n`;
        }
        if (envContent) fs.writeFileSync(ENV_PATH, envContent);

        // 3. Write SOUL.md if provided
        if (soulMd) {
          const workspace =
            config.agents?.defaults?.workspace?.replace("~", os.homedir()) ||
            path.join(OPENCLAW_DIR, "workspace");
          const workspacePath = path.isAbsolute(workspace)
            ? workspace
            : path.resolve(workspace);
          if (!fs.existsSync(workspacePath))
            fs.mkdirSync(workspacePath, { recursive: true });
          fs.writeFileSync(path.join(workspacePath, "SOUL.md"), soulMd);
        }

        // 4. Try to restart/start openclaw
        // Check if openclaw is installed first
        exec("openclaw --version", (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error:
                  "OpenClaw CLI not found. Please install it first using the instructions in the wizard.",
              }),
            );
            return;
          }

          // Restart logic
          exec("openclaw gateway restart", (restartErr) => {
            if (restartErr) {
              // If restart fails, try start
              exec("openclaw gateway start", (startErr) => {
                if (startErr) {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: true,
                      message:
                        "Config saved to " +
                        CONFIG_PATH +
                        ", but gateway failed to start automatically. Use CLI to start it.",
                      warning: startErr.message,
                    }),
                  );
                } else {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: "OpenClaw started successfully!",
                    }),
                  );
                }
              });
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  success: true,
                  message: "OpenClaw config updated and gateway restarted!",
                }),
              );
            }
          });
        });
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else if (req.url === "/api/logs" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const child = spawn("openclaw", ["logs", "--follow", "--plain"]);

    child.stdout.on("data", (data) => {
      res.write(
        `data: ${JSON.stringify({ type: "stdout", msg: data.toString() })}\n\n`,
      );
    });

    child.stderr.on("data", (data) => {
      res.write(
        `data: ${JSON.stringify({ type: "stderr", msg: data.toString() })}\n\n`,
      );
    });

    req.on("close", () => {
      child.kill();
    });
  } else if (req.url === "/api/status" && req.method === "GET") {
    exec("openclaw gateway status", (err, stdout, stderr) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          online: !err,
          output: stdout || stderr,
        }),
      );
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`ClawWizard Bridge running on http://localhost:${PORT}`);
});
