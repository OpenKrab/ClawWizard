# 🦞 ClawWizard

**ClawWizard** is a premium, interactive setup wizard for [OpenClaw](https://github.com/openclaw/openclaw), your personal AI assistant. It provides a full-featured GUI for configuring every aspect of the OpenClaw Gateway, from model providers to messaging channels and agent skills.

<img src="/public/banner.png" alt="ClawWizard Banner" width="700">

## Features

- **🎯 Interactive Onboarding**: Step-by-step guidance for beginners and power users alike.
- **🤖 Provider & Model Picker**: Support for 19+ LLM providers including Anthropic, OpenAI, Kilocode, Ollama, and more.
- **💬 Channel Management**: Easy configuration for WhatsApp, Telegram, Discord, Slack, and 10+ other platforms.
- **🛠️ Tools & Skills**: Select and configure tool groups for your AI agent.
- **🚀 Live Deployment**: Write configuration files directly to `~/.openclaw/` and manage the OpenClaw daemon from the browser.
- **🛰️ Log Streaming**: Watch your AI assistant come to life with real-time log streaming in a web-based terminal.
- **💎 Premium Design**: Dark-mode glassmorphism interface with fluid animations and micro-interactions.

## Getting Started

### Prerequisites

- **Node.js**: v22.0.0 or higher
- **OpenClaw CLI**: Recommended for full deployment functionality

  ```bash
  npm install -g openclaw@latest
  ```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ClawWizard.git
   cd ClawWizard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run in development mode:

   ```bash
   npm run dev
   ```

   *This command runs both the Vite frontend and the Node.js bridge concurrently.*

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- `src/context/`: State management and configuration generation logic.
- `src/pages/`: Modular wizard steps.
- `src/server/`: Bridge server to interact with the local filesystem and OpenClaw CLI.
- `src/data/`: Metadata for templates, models, and providers.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

*Powered by the Lobster Way 🦞*
