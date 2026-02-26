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
  {
    id: "group-manager",
    name: "Group Chat Community Manager",
    icon: "👥",
    description:
      "A bot designed specifically to moderate, answer questions, and manage communities in group chats like Telegram or Discord groups.",
    difficulty: "intermediate",
    useCases: ["automation", "custom"],
    tags: ["Group Chat", "Community", "Telegram", "Discord"],
    config: {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-3-5-haiku",
            fallbacks: ["openai/gpt-4o-mini"],
          },
        },
      },
      channels: {
        telegram: {
          enabled: true,
          botToken: "",
          dmPolicy: "pairing",
          allowFrom: [],
          groupPolicy: "allowlist",
          groups: {
            "*": {
              requireMention: true,
            },
          },
        },
      },
    },
    soulMd: `You are a helpful community manager. Keep your answers concise, friendly, and structured. Do not spam the chat. When mentioned, assist members with their queries or enforce community guidelines gently.`,
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

export const MODEL_PROVIDERS = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    icon: "🧠",
    models: [
      "anthropic/claude-opus-4-6",
      "anthropic/claude-3-7-sonnet",
      "anthropic/claude-3-5-sonnet",
      "anthropic/claude-3-5-haiku",
    ],
    consoleUrl: "https://console.anthropic.com/settings/keys",
    keyPattern: /^sk-ant-/,
    envKey: "ANTHROPIC_API_KEY",
    authChoice: "apiKey",
    cliSetup: 'openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"',
    configSnippet: {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    },
  },
  {
    id: "openai",
    name: "OpenAI (API + Codex)",
    icon: "🤖",
    models: [
      "openai/gpt-5.1-codex",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/o1",
      "openai/o3-mini",
      "openai-codex/gpt-5.3-codex",
    ],
    consoleUrl: "https://platform.openai.com/api-keys",
    keyPattern: /^sk-/,
    envKey: "OPENAI_API_KEY",
    authChoice: "openai-api-key",
    cliSetup:
      'openclaw onboard --auth-choice openai-api-key\n# or: openclaw onboard --openai-api-key "$OPENAI_API_KEY"\n# Codex subscription: openclaw onboard --auth-choice openai-codex',
    configSnippet: {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.1-codex" } } },
    },
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
    envKey: "GEMINI_API_KEY",
    authChoice: "gemini-api-key",
    cliSetup:
      'openclaw onboard --auth-choice gemini-api-key\n# or: openclaw onboard --gemini-api-key "$GEMINI_API_KEY"',
    configSnippet: {
      agents: { defaults: { model: { primary: "google/gemini-2.0-pro" } } },
    },
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🔀",
    models: [
      "openrouter/anthropic/claude-sonnet-4-5",
      "openrouter/anthropic/claude-3.7-sonnet",
      "openrouter/google/gemini-2.0-pro",
      "openrouter/deepseek/deepseek-r1",
    ],
    consoleUrl: "https://openrouter.ai/keys",
    keyPattern: /^sk-or-/,
    envKey: "OPENROUTER_API_KEY",
    authChoice: "apiKey",
    cliSetup:
      'openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"',
    configSnippet: {
      env: { OPENROUTER_API_KEY: "sk-or-..." },
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
        },
      },
    },
  },
  {
    id: "venice",
    name: "Venice AI (Privacy-focused)",
    icon: "🏛️",
    models: [
      "venice/llama-3.3-70b",
      "venice/claude-opus-45",
      "venice/qwen3-coder-480b-a35b-instruct",
      "venice/deepseek-v3.2",
      "venice/venice-uncensored",
    ],
    consoleUrl: "https://venice.ai/settings/api",
    keyPattern: /^vapi_/,
    envKey: "VENICE_API_KEY",
    authChoice: "venice-api-key",
    cliSetup:
      'openclaw onboard --auth-choice venice-api-key\n# or: openclaw onboard --non-interactive --auth-choice venice-api-key --venice-api-key "vapi_xxx"',
    configSnippet: {
      env: { VENICE_API_KEY: "vapi_xxxxxxxxxxxx" },
      agents: { defaults: { model: { primary: "venice/llama-3.3-70b" } } },
    },
  },
  {
    id: "minimax",
    name: "MiniMax (M2.1)",
    icon: "🎭",
    models: ["minimax/MiniMax-M2.1"],
    consoleUrl: "https://platform.minimaxi.com/",
    keyPattern: null,
    envKey: "MINIMAX_API_KEY",
    authChoice: "minimax-portal",
    cliSetup:
      "openclaw plugins enable minimax-portal-auth\nopenclaw onboard --auth-choice minimax-portal\n# or API key: openclaw configure → Model/auth → MiniMax M2.1",
    configSnippet: {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.1" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
          },
        },
      },
    },
  },
  {
    id: "moonshot",
    name: "Moonshot AI (Kimi + Kimi Coding)",
    icon: "🌙",
    models: [
      "moonshot/kimi-k2.5",
      "moonshot/kimi-k2-0905-preview",
      "moonshot/kimi-k2-turbo-preview",
      "moonshot/kimi-k2-thinking",
      "kimi-coding/k2p5",
    ],
    consoleUrl: "https://platform.moonshot.cn/console/api-keys",
    keyPattern: null,
    envKey: "MOONSHOT_API_KEY",
    authChoice: "moonshot-api-key",
    cliSetup:
      "openclaw onboard --auth-choice moonshot-api-key\n# Kimi Coding: openclaw onboard --auth-choice kimi-code-api-key",
    configSnippet: {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "moonshot/kimi-k2.5" } } },
    },
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
    envKey: "MISTRAL_API_KEY",
    authChoice: "mistral-api-key",
    cliSetup:
      'openclaw onboard --auth-choice mistral-api-key\n# or: openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"',
    configSnippet: {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: {
        defaults: { model: { primary: "mistral/mistral-large-latest" } },
      },
    },
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    icon: "✖️",
    models: ["xai/grok-2-latest", "xai/grok-beta"],
    consoleUrl: "https://console.x.ai/",
    keyPattern: null,
    envKey: "XAI_API_KEY",
    authChoice: "xai-api-key",
    cliSetup: "openclaw onboard --auth-choice xai-api-key",
    configSnippet: {
      env: { XAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "xai/grok-2-latest" } } },
    },
  },
  {
    id: "zai",
    name: "Z.AI",
    icon: "🇨🇳",
    models: ["zai/glm-5"],
    consoleUrl: null,
    keyPattern: null,
    envKey: "ZAI_API_KEY",
    authChoice: "zai-api-key",
    cliSetup:
      'openclaw onboard --auth-choice zai-api-key\n# or: openclaw onboard --zai-api-key "$ZAI_API_KEY"\n# Endpoint choices: --auth-choice zai-coding-global / zai-coding-cn',
    configSnippet: {
      env: { ZAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "zai/glm-5" } } },
    },
  },
  {
    id: "opencode",
    name: "OpenCode Zen",
    icon: "🧪",
    models: ["opencode/claude-opus-4-6"],
    consoleUrl: "https://opencode.ai/auth",
    keyPattern: null,
    envKey: "OPENCODE_API_KEY",
    authChoice: "opencode-zen",
    cliSetup:
      'openclaw onboard --auth-choice opencode-zen\n# or: openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"',
    configSnippet: {
      env: { OPENCODE_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
    },
  },
  {
    id: "vercel-ai-gateway",
    name: "Vercel AI Gateway",
    icon: "▲",
    models: ["vercel-ai-gateway/anthropic/claude-opus-4.6"],
    consoleUrl: "https://vercel.com/",
    keyPattern: null,
    envKey: "AI_GATEWAY_API_KEY",
    authChoice: "ai-gateway-api-key",
    cliSetup:
      'openclaw onboard --auth-choice ai-gateway-api-key\n# or: openclaw onboard --non-interactive --auth-choice ai-gateway-api-key --ai-gateway-api-key "$AI_GATEWAY_API_KEY"',
    configSnippet: {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    },
  },
  {
    id: "together",
    name: "Together AI",
    icon: "🤝",
    models: [
      "together/moonshotai/Kimi-K2.5",
      "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "together/deepseek-ai/DeepSeek-V3",
    ],
    consoleUrl: "https://api.together.xyz/settings/api-keys",
    keyPattern: null,
    envKey: "TOGETHER_API_KEY",
    authChoice: "together-api-key",
    cliSetup:
      'openclaw onboard --auth-choice together-api-key\n# or: openclaw onboard --non-interactive --auth-choice together-api-key --together-api-key "$TOGETHER_API_KEY"',
    configSnippet: {
      agents: {
        defaults: { model: { primary: "together/moonshotai/Kimi-K2.5" } },
      },
    },
  },
  {
    id: "cloudflare-ai-gateway",
    name: "Cloudflare AI Gateway",
    icon: "🔶",
    models: [],
    consoleUrl: "https://dash.cloudflare.com/",
    keyPattern: null,
    envKey: "CLOUDFLARE_AI_GATEWAY_API_KEY",
    authChoice: "cloudflare-ai-gateway-api-key",
    cliSetup:
      'openclaw onboard --non-interactive \\\n  --auth-choice cloudflare-ai-gateway-api-key \\\n  --cloudflare-ai-gateway-account-id "your-account-id" \\\n  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \\\n  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"',
    configSnippet: {},
  },
  {
    id: "qwen",
    name: "Qwen (OAuth)",
    icon: "🔮",
    models: ["qwen/qwen-max", "qwen/qwen-plus", "qwen/qwen-turbo"],
    consoleUrl: "https://dashscope.console.aliyun.com/",
    keyPattern: null,
    envKey: null,
    authChoice: null,
    cliSetup: "openclaw onboard # choose: Qwen",
    configSnippet: {
      agents: { defaults: { model: { primary: "qwen/qwen-max" } } },
    },
  },
  {
    id: "litellm",
    name: "LiteLLM (Unified Gateway)",
    icon: "🔗",
    models: [],
    consoleUrl: "https://docs.litellm.ai/",
    keyPattern: null,
    envKey: null,
    authChoice: null,
    cliSetup: "openclaw configure # choose: LiteLLM",
    configSnippet: {},
  },
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    icon: "☁️",
    models: [],
    consoleUrl: "https://console.aws.amazon.com/bedrock/home",
    keyPattern: null,
    envKey: null,
    authChoice: null,
    cliSetup: "openclaw configure # choose: Amazon Bedrock",
    configSnippet: {},
  },
  {
    id: "synthetic",
    name: "Synthetic (Anthropic-compatible)",
    icon: "🧬",
    models: [],
    consoleUrl: null,
    keyPattern: null,
    envKey: "SYNTHETIC_API_KEY",
    authChoice: "synthetic-api-key",
    cliSetup:
      'openclaw onboard --non-interactive --auth-choice synthetic-api-key --synthetic-api-key "$SYNTHETIC_API_KEY"',
    configSnippet: {
      env: { SYNTHETIC_API_KEY: "sk-..." },
    },
  },
  {
    id: "huggingface",
    name: "Hugging Face (Inference)",
    icon: "🤗",
    models: [],
    consoleUrl: "https://huggingface.co/settings/tokens",
    keyPattern: /^hf_/,
    envKey: null,
    authChoice: null,
    cliSetup: "openclaw configure # choose: Hugging Face",
    configSnippet: {},
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    icon: "🟢",
    models: [],
    consoleUrl: "https://build.nvidia.com/",
    keyPattern: null,
    envKey: null,
    authChoice: null,
    cliSetup: "openclaw configure # choose: NVIDIA",
    configSnippet: {},
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    icon: "🏠",
    models: [
      "ollama/gpt-oss:20b",
      "ollama/llama3.3",
      "ollama/qwen2.5-coder:32b",
      "ollama/deepseek-r1:32b",
    ],
    consoleUrl: null,
    keyPattern: null,
    envKey: "OLLAMA_API_KEY",
    authChoice: "skip",
    cliSetup:
      'ollama pull gpt-oss:20b\nexport OLLAMA_API_KEY="ollama-local"\nopenclaw config set models.providers.ollama.apiKey "ollama-local"',
    configSnippet: {
      agents: { defaults: { model: { primary: "ollama/gpt-oss:20b" } } },
    },
  },
  {
    id: "vllm",
    name: "vLLM (Local)",
    icon: "🚀",
    models: [],
    consoleUrl: null,
    keyPattern: null,
    envKey: null,
    authChoice: null,
    cliSetup: "openclaw configure # choose: vLLM",
    configSnippet: {},
  },
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
    envKey: "KILO_API_KEY",
    authChoice: "apiKey",
    cliSetup: "openclaw onboard # choose: Kilocode",
    configSnippet: {
      agents: {
        defaults: {
          model: { primary: "kilocode/anthropic/claude-3-7-sonnet" },
        },
      },
    },
  },
  {
    id: "groq",
    name: "Groq (LPU Inference)",
    icon: "🔥",
    models: [
      "groq/llama-3.3-70b-versatile",
      "groq/deepseek-r1-distill-llama-70b",
    ],
    consoleUrl: "https://console.groq.com/keys",
    keyPattern: /^gsk_/,
    envKey: "GROQ_API_KEY",
    authChoice: "groq-api-key",
    cliSetup: "openclaw onboard --auth-choice groq-api-key",
    configSnippet: {
      env: { GROQ_API_KEY: "gsk_..." },
    },
  },
  {
    id: "deepseek",
    name: "DeepSeek (Direct)",
    icon: "🐳",
    models: ["deepseek/deepseek-chat", "deepseek/deepseek-reasoner"],
    consoleUrl: "https://platform.deepseek.com/api_keys",
    keyPattern: /^sk-/,
    envKey: "DEEPSEEK_API_KEY",
    authChoice: "deepseek-api-key",
    cliSetup: "openclaw onboard --auth-choice deepseek-api-key",
    configSnippet: {
      env: { DEEPSEEK_API_KEY: "sk-..." },
    },
  },
  {
    id: "glm",
    name: "GLM (Zhipu AI)",
    icon: "🇨🇳",
    models: ["glm/glm-4-plus", "glm/glm-4-flash"],
    consoleUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    keyPattern: null,
    envKey: "ZHIPU_API_KEY",
    authChoice: "zhipu-api-key",
    cliSetup: "openclaw onboard --auth-choice zhipu-api-key",
    configSnippet: {
      env: { ZHIPU_API_KEY: "..." },
    },
  },
  {
    id: "qianfan",
    name: "Baidu Qianfan",
    icon: "🐻",
    models: ["qianfan/ernie-4.0", "qianfan/ernie-3.5"],
    consoleUrl:
      "https://console.bce.baidu.com/qianfan/ais/console/application/list",
    keyPattern: null,
    envKey: "QIANFAN_ACCESS_KEY",
    authChoice: "qianfan-api-key",
    cliSetup: "openclaw configure # choose: Qianfan",
    configSnippet: {},
  },
  {
    id: "deepgram",
    name: "Deepgram (Voice/Transcription)",
    icon: "🎙️",
    models: ["deepgram/nova-2"],
    consoleUrl: "https://console.deepgram.com/",
    keyPattern: null,
    envKey: "DEEPGRAM_API_KEY",
    authChoice: "deepgram-api-key",
    cliSetup: "openclaw onboard --auth-choice deepgram-api-key",
    configSnippet: {
      env: { DEEPGRAM_API_KEY: "..." },
    },
  },
  {
    id: "xiaomi",
    name: "Xiaomi Xiaoai AI",
    icon: "📱",
    models: ["xiaomi/mi-llama-3"],
    consoleUrl: null,
    keyPattern: null,
    envKey: "XIAOMI_API_KEY",
    authChoice: "xiaomi-api-key",
    cliSetup: "openclaw configure # choose: Xiaomi",
    configSnippet: {},
  },
  {
    id: "custom",
    name: "Custom Provider",
    icon: "⚙️",
    models: [],
    consoleUrl: null,
    keyPattern: null,
    envKey: "CUSTOM_API_KEY",
    authChoice: "custom-api-key",
    cliSetup:
      'openclaw onboard --non-interactive \\\n  --auth-choice custom-api-key \\\n  --custom-base-url "https://llm.example.com/v1" \\\n  --custom-model-id "model-name" \\\n  --custom-api-key "$CUSTOM_API_KEY" \\\n  --custom-compatibility openai',
    configSnippet: {},
  },
];

export const MESSAGING_CHANNELS = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "📱",
    envKey: "TELEGRAM_BOT_TOKEN",
    cliSetup: `openclaw channels add --channel telegram --token "$TELEGRAM_BOT_TOKEN"\nopenclaw gateway`,
    configSnippet: {
      channels: {
        telegram: {
          enabled: true,
          botToken: "YOUR_BOT_TOKEN",
          dmPolicy: "pairing",
          groups: { "*": { requireMention: true } },
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/telegram",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "🟢",
    envKey: null,
    cliSetup: `openclaw channels login --channel whatsapp\nopenclaw gateway`,
    configSnippet: {
      channels: {
        whatsapp: {
          dmPolicy: "pairing",
          allowFrom: ["+15551234567"],
          groupPolicy: "allowlist",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/whatsapp",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "👾",
    envKey: "DISCORD_BOT_TOKEN",
    cliSetup: `openclaw channels add --channel discord --token "$DISCORD_BOT_TOKEN"\nopenclaw gateway`,
    configSnippet: {
      channels: {
        discord: {
          enabled: true,
          token: "YOUR_BOT_TOKEN",
          groupPolicy: "allowlist",
          guilds: {
            YOUR_SERVER_ID: { requireMention: true, users: ["YOUR_USER_ID"] },
          },
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/discord",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    envKey: "SLACK_BOT_TOKEN",
    cliSetup: `openclaw channels add --channel slack --bot-token "xoxb-YOUR_BOT_TOKEN" --app-token "xapp-YOUR_APP_TOKEN"\nopenclaw gateway`,
    configSnippet: {
      channels: {
        slack: {
          enabled: true,
          mode: "socket",
          appToken: "xapp-...",
          botToken: "xoxb-...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/slack",
  },
  {
    id: "signal",
    name: "Signal",
    icon: "💙",
    envKey: null,
    cliSetup: `openclaw channels add --channel signal --signal-number "+15551234567" --cli-path "signal-cli"\nopenclaw pairing approve signal <CODE>`,
    configSnippet: {
      channels: {
        signal: {
          enabled: true,
          account: "+15551234567",
          cliPath: "signal-cli",
          dmPolicy: "pairing",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/signal",
  },
  {
    id: "bluebubbles",
    name: "BlueBubbles (iMessage)",
    icon: "🫧",
    envKey: null,
    cliSetup: `openclaw channels add --channel bluebubbles --webhook-path "/bluebubbles-webhook"`,
    configSnippet: {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/bluebubbles",
  },
  {
    id: "feishu",
    name: "Feishu / Lark",
    icon: "🐦",
    envKey: "FEISHU_APP_ID",
    cliSetup: "openclaw channels add --channel feishu",
    configSnippet: {
      channels: {
        feishu: {
          enabled: true,
          appId: "...",
          appSecret: "...",
          encryptKey: "...",
          verificationToken: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/feishu",
  },
  {
    id: "googlechat",
    name: "Google Chat",
    icon: "📧",
    envKey: null,
    cliSetup: `openclaw channels add --channel googlechat --audience-type "project-number" --audience "123456789" --webhook-url "$WEBHOOK_URL" --webhook-path "/googlechat-webhook"`,
    configSnippet: {
      channels: {
        googlechat: {
          enabled: true,
          webhookPath: "/googlechat-webhook",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/googlechat",
  },
  {
    id: "mattermost",
    name: "Mattermost",
    icon: "🔵",
    envKey: "MATTERMOST_BOT_TOKEN",
    cliSetup: "openclaw channels add --channel mattermost",
    configSnippet: {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "...",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/mattermost",
  },
  {
    id: "signal",
    name: "Signal",
    icon: "💙",
    envKey: null,
    cliSetup:
      'signal-cli link -n "OpenClaw"\nopenclaw pairing approve signal <CODE>',
    configSnippet: {
      channels: {
        signal: {
          enabled: true,
          account: "+15551234567",
          cliPath: "signal-cli",
          dmPolicy: "pairing",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/signal",
  },
  {
    id: "bluebubbles",
    name: "BlueBubbles (iMessage)",
    icon: "🫧",
    envKey: null,
    cliSetup: "openclaw onboard # (Select BlueBubbles)",
    configSnippet: {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/bluebubbles",
  },
  {
    id: "imessage",
    name: "iMessage (Legacy)",
    icon: "💬",
    envKey: null,
    cliSetup: "openclaw plugins install imsg",
    configSnippet: {
      channels: {
        imessage: {
          enabled: true,
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/imessage",
  },
  {
    id: "msteams",
    name: "MS Teams",
    icon: "🟣",
    envKey: "MSTEAMS_APP_ID",
    cliSetup: "openclaw channels add --channel msteams",
    configSnippet: {
      channels: {
        msteams: {
          enabled: true,
          appId: "...",
          appPassword: "...",
          tenantId: "...",
          webhook: { port: 3978, path: "/api/messages" },
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/msteams",
  },
  {
    id: "synologychat",
    name: "Synology Chat",
    icon: "☁️",
    envKey: null,
    cliSetup: "openclaw plugins install synology-chat",
    configSnippet: {
      channels: {
        synologychat: {
          enabled: true,
          incomingWebhookUrl: "...",
          token: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/synology-chat",
  },
  {
    id: "line",
    name: "LINE",
    icon: "📱",
    envKey: "LINE_CHANNEL_ACCESS_TOKEN",
    cliSetup: "openclaw channels add --channel line",
    configSnippet: {
      channels: {
        line: {
          enabled: true,
          channelAccessToken: "...",
          channelSecret: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/line",
  },
  {
    id: "matrix",
    name: "Matrix",
    icon: "🟢",
    envKey: "MATRIX_ACCESS_TOKEN",
    cliSetup: `openclaw channels add --channel matrix --homeserver "https://matrix.org" --user-id "@mybot:matrix.org" --password "BOT_PASS"`,
    configSnippet: {
      channels: {
        matrix: {
          enabled: true,
          homeserver: "https://matrix.org",
          userId: "@bot:matrix.org",
          accessToken: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/matrix",
  },
  {
    id: "nextcloud",
    name: "Nextcloud Talk",
    icon: "☁️",
    envKey: null,
    cliSetup: "openclaw plugins install nextcloud-talk",
    configSnippet: {
      channels: {
        nextcloud: {
          enabled: true,
          baseUrl: "https://nextcloud.example.com",
          token: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/nextcloud-talk",
  },
  {
    id: "nostr",
    name: "Nostr",
    icon: "💜",
    envKey: "NOSTR_PRIVATE_KEY",
    cliSetup: "openclaw channels add --channel nostr",
    configSnippet: {
      channels: {
        nostr: {
          enabled: true,
          privateKey: "...",
          relays: ["wss://relay.damus.io"],
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/nostr",
  },
  {
    id: "tlon",
    name: "Tlon (Urbit)",
    icon: "🛸",
    envKey: null,
    cliSetup: `openclaw channels add --channel tlon --ship "~sampel-palnet" --code "suqhut-matpyl-..." --url "http://localhost:8080"`,
    configSnippet: {
      channels: {
        tlon: {
          enabled: true,
          ship: "~bitbet-bolmet",
          code: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/tlon",
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: "🟣",
    envKey: "TWITCH_OAUTH_TOKEN",
    cliSetup: "openclaw channels add --channel twitch",
    configSnippet: {
      channels: {
        twitch: {
          enabled: true,
          channels: ["#streamername"],
          oauthToken: "...",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/twitch",
  },
  {
    id: "zalo",
    name: "Zalo (Bot API)",
    icon: "🔵",
    envKey: "ZALO_BOT_TOKEN",
    cliSetup: "openclaw channels add --channel zalo",
    configSnippet: {
      channels: {
        zalo: {
          enabled: true,
          botToken: "...",
          dmPolicy: "pairing",
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/zalo",
  },
  {
    id: "zalouser",
    name: "Zalo (Personal)",
    icon: "👤",
    envKey: null,
    cliSetup: "openclaw channels add --channel zalouser",
    configSnippet: {
      channels: {
        zalouser: {
          enabled: true,
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/zalouser",
  },
  {
    id: "irc",
    name: "IRC",
    icon: "⌨️",
    envKey: null,
    cliSetup: "openclaw channels add --channel irc",
    configSnippet: {
      channels: {
        irc: {
          enabled: true,
          server: "irc.libera.chat",
          port: 6697,
          nick: "OpenClawBot",
          channels: ["#openclaw"],
        },
      },
    },
    docsUrl: "https://docs.openclaw.ai/channels/irc",
  },
  {
    id: "webchat",
    name: "WebChat",
    icon: "🎨",
    envKey: null,
    cliSetup: "openclaw gateway",
    configSnippet: {
      gateway: {
        port: 18789,
        bind: "loopback",
        auth: { mode: "token", token: "your-secure-token" },
      },
    },
    docsUrl: "https://docs.openclaw.ai/web/webchat",
  },
];

export const TOOL_GROUPS = [
  {
    id: "group:runtime",
    name: "Runtime",
    icon: "⚡",
    desc: "Shell execution, process management",
    tools: ["exec", "bash", "process"],
  },
  {
    id: "group:fs",
    name: "File System",
    icon: "📂",
    desc: "Read, write, edit files",
    tools: ["read", "write", "edit", "apply_patch"],
  },
  {
    id: "group:sessions",
    name: "Sessions",
    icon: "🔗",
    desc: "Multi-agent session management",
    tools: [
      "sessions_list",
      "sessions_history",
      "sessions_send",
      "sessions_spawn",
      "session_status",
    ],
  },
  {
    id: "group:memory",
    name: "Memory",
    icon: "🧠",
    desc: "Long-term memory search and retrieval",
    tools: ["memory_search", "memory_get"],
  },
  {
    id: "group:web",
    name: "Web",
    icon: "🌐",
    desc: "Web search and content fetching",
    tools: ["web_search", "web_fetch"],
  },
  {
    id: "group:ui",
    name: "UI & Browser",
    icon: "🖼️",
    desc: "Browser control, canvas, and nodes",
    tools: ["browser", "canvas", "nodes"],
  },
  {
    id: "group:automation",
    name: "Automation",
    icon: "⏰",
    desc: "Scheduled tasks and gateway control",
    tools: ["cron", "gateway"],
  },
  {
    id: "group:messaging",
    name: "Messaging",
    icon: "💬",
    desc: "Send messages and images",
    tools: ["message", "image"],
  },
  {
    id: "group:nodes",
    name: "Remote Nodes",
    icon: "📱",
    desc: "Mobile and headless node interaction",
    tools: ["nodes"],
  },
  {
    id: "group:advanced",
    name: "Advanced Workflows",
    icon: "🛠️",
    desc: "Lobster workflows and structured LLM tasks",
    tools: ["lobster", "llm-task"],
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

import workspaceTemplatesData from "./templates.json";

export const WORKSPACE_TEMPLATES = workspaceTemplatesData;
