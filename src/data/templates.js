export const TEMPLATES = [
  {
    id: "personal-telegram",
    name: "24/7 Personal AI on Telegram",
    icon: "📱",
    description:
      "Always-on personal assistant accessible through Telegram. Handles tasks, answers questions, and manages your schedule.",
    difficulty: "beginner",
    useCases: ["personal", "custom"],
    tags: ["Telegram", "Anthropic", "Web Search"],
    config: {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-3-7-sonnet",
            fallbacks: ["anthropic/claude-3-5-haiku"],
          },
        },
      },
      channels: {
        telegram: {
          enabled: true,
          botToken: "",
          dmPolicy: "pairing",
          allowFrom: [],
        },
      },
    },
    soulMd: `You are a helpful personal AI assistant. Be friendly, concise, and proactive. Help with tasks, answer questions, and provide useful information.`,
  },
  {
    id: "coding-ollama",
    name: "Local Coding Agent (Ollama)",
    icon: "💻",
    description:
      "Local-first coding assistant using Ollama. Full filesystem access, code execution, and browser for docs lookup.",
    difficulty: "intermediate",
    useCases: ["coding", "custom"],
    tags: ["Ollama", "Local", "Code Exec", "Browser"],
    config: {
      agents: {
        defaults: {
          model: { primary: "ollama/deepseek-coder-v2", fallbacks: [] },
        },
      },
      channels: {
        webchat: { enabled: true },
      },
    },
    soulMd: `You are an expert software engineer. Write clean, well-documented code. Explain your reasoning. Test your solutions. Use tools to read files, write code, and search the web for documentation.`,
  },
  {
    id: "research-bot",
    name: "Web Research + Summary Bot",
    icon: "🔬",
    description:
      "Research assistant that searches the web, reads articles, and provides structured summaries with sources.",
    difficulty: "beginner",
    useCases: ["research", "content", "custom"],
    tags: ["OpenRouter", "Web Search", "Browser"],
    config: {
      agents: {
        defaults: {
          model: {
            primary: "openrouter/anthropic/claude-3.7-sonnet",
            fallbacks: [],
          },
        },
      },
      channels: {
        telegram: {
          enabled: true,
          botToken: "",
          dmPolicy: "pairing",
          allowFrom: [],
        },
        webchat: { enabled: true },
      },
    },
    soulMd: `You are a thorough research assistant. When asked about a topic, use web_search and web_fetch to find relevant information. Always cite your sources. Provide structured summaries with key findings.`,
  },
  {
    id: "browser-automation",
    name: "Browser Automation Agent",
    icon: "🌐",
    description:
      "Autonomous browser agent that can navigate websites, fill forms, extract data, and automate repetitive web tasks.",
    difficulty: "advanced",
    useCases: ["automation", "custom"],
    tags: ["Browser", "Cron", "Anthropic"],
    config: {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-3-7-sonnet", fallbacks: [] },
        },
      },
      channels: {
        webchat: { enabled: true },
      },
    },
    soulMd: `You are a browser automation expert. You can navigate websites, interact with web pages, fill forms, and extract information. Be precise with your browser actions. Always verify results.`,
  },
  {
    id: "multi-channel",
    name: "Multi-Channel Assistant",
    icon: "📡",
    description:
      "Connect to Telegram, Discord, and Slack simultaneously. One AI, all your messaging platforms.",
    difficulty: "intermediate",
    useCases: ["personal", "custom"],
    tags: ["Telegram", "Discord", "Slack", "Multi-channel"],
    config: {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-3-7-sonnet",
            fallbacks: ["openai/gpt-4o"],
          },
        },
      },
      channels: {
        telegram: {
          enabled: true,
          botToken: "",
          dmPolicy: "pairing",
          allowFrom: [],
        },
        discord: {
          enabled: true,
          botToken: "",
          applicationId: "",
          dmPolicy: "pairing",
          allowFrom: [],
        },
        slack: {
          enabled: true,
          botToken: "",
          appToken: "",
          dmPolicy: "pairing",
          allowFrom: [],
        },
      },
    },
    soulMd: `You are a versatile personal assistant available across multiple messaging platforms. Adapt your formatting to each platform. Be helpful and responsive.`,
  },
  {
    id: "trading-bot",
    name: "Trading & Market Analysis",
    icon: "📈",
    description:
      "Market research agent that fetches prices, analyzes trends, and provides trading insights. Cron-based alerts.",
    difficulty: "advanced",
    useCases: ["trading", "custom"],
    tags: ["Cron", "Web Fetch", "Telegram", "Alerts"],
    config: {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-3-7-sonnet", fallbacks: [] },
        },
      },
      channels: {
        telegram: {
          enabled: true,
          botToken: "",
          dmPolicy: "pairing",
          allowFrom: [],
        },
      },
    },
    soulMd: `You are a market analysis assistant. Fetch real-time market data, analyze trends, and provide actionable insights. Use cron jobs for scheduled alerts. Always disclaim that you are not providing financial advice.`,
  },
];

export const USE_CASES = [
  {
    id: "personal",
    icon: "🤖",
    title: "Personal Assistant",
    desc: "Daily tasks, reminders, Q&A, and life management",
    difficulty: "beginner",
    cost: "Low",
  },
  {
    id: "coding",
    icon: "💻",
    title: "Coding Helper",
    desc: "Code writing, debugging, file management, and docs lookup",
    difficulty: "intermediate",
    cost: "Medium",
  },
  {
    id: "content",
    icon: "✍️",
    title: "Content Creator",
    desc: "Writing, editing, social media, and creative work",
    difficulty: "beginner",
    cost: "Low",
  },
  {
    id: "automation",
    icon: "🔧",
    title: "Automation & Scraping",
    desc: "Web scraping, browser automation, and scheduled tasks",
    difficulty: "advanced",
    cost: "Medium",
  },
  {
    id: "trading",
    icon: "📈",
    title: "Trading Bot",
    desc: "Market data, analysis, alerts, and portfolio tracking",
    difficulty: "advanced",
    cost: "High",
  },
  {
    id: "research",
    icon: "🔬",
    title: "Research Agent",
    desc: "Deep web research, summarization, and report generation",
    difficulty: "intermediate",
    cost: "Medium",
  },
  {
    id: "custom",
    icon: "⚡",
    title: "Custom Setup",
    desc: "Start from scratch and configure everything yourself",
    difficulty: "any",
    cost: "Varies",
  },
];

export const CHANNEL_META = {
  whatsapp: {
    name: "WhatsApp",
    icon: "📱",
    desc: "Connect via Baileys (no business API needed)",
    fields: ["allowFrom"],
    guide: "Scan QR code from the terminal when pairing",
  },
  telegram: {
    name: "Telegram",
    icon: "🤖",
    desc: "Create a bot via @BotFather",
    fields: ["botToken", "dmPolicy", "allowFrom"],
    guide: "Open Telegram → Search @BotFather → /newbot → Copy token",
    guideUrl: "https://t.me/BotFather",
  },
  discord: {
    name: "Discord",
    icon: "🎮",
    desc: "Discord bot with message content intent",
    fields: ["botToken", "applicationId", "dmPolicy", "allowFrom"],
    guide:
      "Go to Discord Developer Portal → New Application → Bot → Copy Token + Enable Message Content Intent",
    guideUrl: "https://discord.com/developers/applications",
  },
  slack: {
    name: "Slack",
    icon: "💼",
    desc: "Slack app with Socket Mode",
    fields: ["botToken", "appToken", "dmPolicy", "allowFrom"],
    guide:
      "Create Slack app → Enable Socket Mode → Install to workspace → Copy Bot Token + App Token",
    guideUrl: "https://api.slack.com/apps",
  },
  signal: {
    name: "Signal",
    icon: "🔒",
    desc: "Via signal-cli (requires linked device)",
    fields: [],
  },
  imessage: {
    name: "iMessage",
    icon: "💬",
    desc: "macOS only (legacy)",
    fields: [],
  },
  googlechat: {
    name: "Google Chat",
    icon: "📧",
    desc: "Via Google Chat API",
    fields: [],
  },
  mattermost: {
    name: "Mattermost",
    icon: "🔵",
    desc: "Self-hosted team chat",
    fields: ["url", "token"],
  },
  msteams: {
    name: "MS Teams",
    icon: "🟣",
    desc: "Microsoft Teams extension",
    fields: [],
  },
  bluebubbles: {
    name: "BlueBubbles",
    icon: "🫧",
    desc: "iMessage via BlueBubbles server (recommended)",
    fields: [],
  },
  matrix: {
    name: "Matrix",
    icon: "🟢",
    desc: "Matrix protocol extension",
    fields: [],
  },
  zalo: { name: "Zalo", icon: "🔵", desc: "Zalo OA extension", fields: [] },
  webchat: {
    name: "WebChat",
    icon: "🖥️",
    desc: "Built-in browser chat UI at gateway URL",
    fields: [],
  },
};

export const MODEL_PROVIDERS = [
  {
    id: "kilocode",
    name: "Kilocode (Kilo Gateway)",
    icon: "⚡",
    models: [
      "kilocode/anthropic/claude-3-7-sonnet",
      "kilocode/openai/gpt-4o",
      "kilocode/anthropic/claude-3-opus",
      "kilocode/google/gemini-2.0-pro",
    ],
    consoleUrl: "https://app.kilo.ai/",
    keyPattern: null,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🧠",
    models: [
      "anthropic/claude-3-7-sonnet",
      "anthropic/claude-3-5-sonnet",
      "anthropic/claude-3-5-haiku",
      "anthropic/claude-3-opus",
    ],
    consoleUrl: "https://console.anthropic.com/settings/keys",
    keyPattern: /^sk-ant-/,
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "🤖",
    models: [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/o1",
      "openai/o3-mini",
    ],
    consoleUrl: "https://platform.openai.com/api-keys",
    keyPattern: /^sk-/,
  },
  {
    id: "google",
    name: "Google (Gemini)",
    icon: "💎",
    models: [
      "google/gemini-2.0-pro",
      "google/gemini-2.0-flash",
      "google/gemini-1.5-pro",
    ],
    consoleUrl: "https://aistudio.google.com/apikey",
    keyPattern: /^AIza/,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🔀",
    models: [
      "openrouter/anthropic/claude-3.7-sonnet",
      "openrouter/google/gemini-2.0-pro",
      "openrouter/deepseek/deepseek-r1",
    ],
    consoleUrl: "https://openrouter.ai/keys",
    keyPattern: /^sk-or-/,
  },
  {
    id: "groq",
    name: "Groq",
    icon: "⚡",
    models: [
      "groq/llama-3.3-70b-versatile",
      "groq/mixtral-8x7b-32768",
      "groq/gemma2-9b-it",
    ],
    consoleUrl: "https://console.groq.com/keys",
    keyPattern: /^gsk_/,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    icon: "🌪️",
    models: [
      "mistral/mistral-large-latest",
      "mistral/pixtral-large-latest",
      "mistral/codestral-latest",
    ],
    consoleUrl: "https://console.mistral.ai/api-keys",
    keyPattern: null,
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    icon: "✖️",
    models: ["xai/grok-2-latest", "xai/grok-beta"],
    consoleUrl: "https://console.x.ai/",
    keyPattern: null,
  },
  {
    id: "together",
    name: "Together AI",
    icon: "🤝",
    models: [
      "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "together/deepseek-ai/DeepSeek-V3",
    ],
    consoleUrl: "https://api.together.xyz/settings/api-keys",
    keyPattern: null,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐳",
    models: ["deepseek/deepseek-chat", "deepseek/deepseek-coder"],
    consoleUrl: "https://platform.deepseek.com/api_keys",
    keyPattern: /^sk-/,
  },
  {
    id: "cerebras",
    name: "Cerebras",
    icon: "🧠",
    models: ["cerebras/llama3.3-70b", "cerebras/llama3.1-8b"],
    consoleUrl: "https://cloud.cerebras.ai/",
    keyPattern: /^csk-/,
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    icon: "🏠",
    models: ["ollama/llama3.3", "ollama/deepseek-coder-v2", "ollama/mistral"],
    consoleUrl: null,
    keyPattern: null,
  },
  {
    id: "vllm",
    name: "vLLM (Local)",
    icon: "🚀",
    models: [],
    consoleUrl: null,
    keyPattern: null,
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    icon: "🖥️",
    models: [],
    consoleUrl: null,
    keyPattern: null,
  },
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    icon: "☁️",
    models: [],
    consoleUrl: "https://console.aws.amazon.com/bedrock/home",
    keyPattern: null,
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    icon: "🟦",
    models: [],
    consoleUrl: "https://portal.azure.com/",
    keyPattern: null,
  },
  {
    id: "moonshot",
    name: "Moonshot AI",
    icon: "🌙",
    models: ["moonshot/moonshot-v1-8k", "moonshot/moonshot-v1-32k"],
    consoleUrl: "https://platform.moonshot.cn/console/api-keys",
    keyPattern: null,
  },
  {
    id: "minimax",
    name: "MiniMax",
    icon: "🎭",
    models: ["minimax/abab6.5-chat", "minimax/abab6.5s-chat"],
    consoleUrl: "https://platform.minimaxi.com/",
    keyPattern: null,
  },
  {
    id: "venice",
    name: "Venice AI",
    icon: "🏛️",
    models: ["venice/llama-3.3-70b", "venice/deepseek-r1-distill-llama-70b"],
    consoleUrl: "https://venice.ai/settings/api",
    keyPattern: null,
  },
  {
    id: "custom",
    name: "Custom Provider",
    icon: "⚙️",
    models: [],
    consoleUrl: null,
    keyPattern: null,
  },
];

export const TOOL_GROUPS = [
  {
    id: "group:runtime",
    name: "Runtime",
    icon: "⚡",
    desc: "Shell execution, process management",
    tools: ["exec", "bash", "process", "apply_patch"],
  },
  {
    id: "group:fs",
    name: "File System",
    icon: "📂",
    desc: "Read, write, edit files",
    tools: ["read", "write", "edit"],
  },
  {
    id: "group:web",
    name: "Web",
    icon: "🌐",
    desc: "Web search, fetch pages, browse",
    tools: ["web_search", "web_fetch", "browser"],
  },
  {
    id: "group:ui",
    name: "UI",
    icon: "🖼️",
    desc: "Canvas, nodes, visual workspace",
    tools: ["canvas", "nodes"],
  },
  {
    id: "sessions",
    name: "Sessions",
    icon: "🔗",
    desc: "Multi-agent session management",
    tools: [
      "sessions_list",
      "sessions_history",
      "sessions_send",
      "sessions_spawn",
    ],
  },
  {
    id: "cron",
    name: "Cron & Automation",
    icon: "⏰",
    desc: "Scheduled tasks and wakeups",
    tools: ["cron"],
  },
  {
    id: "messaging",
    name: "Messaging",
    icon: "💬",
    desc: "Send messages, images across channels",
    tools: ["message", "image"],
  },
  {
    id: "gateway",
    name: "Gateway Control",
    icon: "🔌",
    desc: "Gateway management from agent",
    tools: ["gateway"],
  },
];

export const DIAGNOSTICS_CHECKS = [
  {
    id: "gateway",
    name: "Gateway Status",
    desc: "Check if gateway is running on configured port",
    cmd: "openclaw gateway status",
  },
  {
    id: "model",
    name: "Model Connectivity",
    desc: "Test API key validity and model response latency",
    cmd: "openclaw doctor",
  },
  {
    id: "channels",
    name: "Channel Connections",
    desc: "Verify each enabled channel can connect",
    cmd: "openclaw doctor",
  },
  {
    id: "tools",
    name: "Tool Permissions",
    desc: "Check tool sandbox and execution permissions",
    cmd: "openclaw doctor",
  },
  {
    id: "daemon",
    name: "Daemon Service",
    desc: "Check if the background daemon is installed and running",
    cmd: "openclaw status",
  },
  {
    id: "config",
    name: "Config Validation",
    desc: "Validate openclaw.json against schema",
    cmd: "openclaw doctor --fix",
  },
];

export const PERSONALITY_PRESETS = [
  {
    id: "professional",
    name: "Professional",
    desc: "Clear, structured, formal tone",
    soul: `You are a professional AI assistant. Be clear, concise, and structured in your responses. Use proper formatting and maintain a formal yet approachable tone.`,
  },
  {
    id: "friendly",
    name: "Friendly",
    desc: "Warm, conversational, emoji-friendly",
    soul: `You are a friendly and warm AI companion! 😊 Be conversational, use casual language, and sprinkle in emojis when appropriate. Make every interaction feel like chatting with a knowledgeable friend.`,
  },
  {
    id: "technical",
    name: "Technical",
    desc: "Precise, detailed, code-oriented",
    soul: `You are a technical expert. Provide precise, detailed explanations with code examples. Use proper technical terminology. Format code blocks with syntax highlighting. Cite documentation when relevant.`,
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Short, direct, no fluff",
    soul: `Be extremely concise. Answer in as few words as possible. No greeting, no filler. Just the answer.`,
  },
];
