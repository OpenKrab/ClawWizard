import { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'clawwizard_state'

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: '🦞' },
  { id: 'model', label: 'Model & Auth', icon: '🤖' },
  { id: 'workspace', label: 'Workspace', icon: '📁' },
  { id: 'gateway', label: 'Gateway', icon: '🌐' },
  { id: 'channels', label: 'Channels', icon: '💬' },
  { id: 'tools', label: 'Tools & Skills', icon: '🔧' },
  { id: 'deploy', label: 'Preview & Deploy', icon: '🚀' },
]

const defaultConfig = {
  agents: {
    defaults: {
      model: {
        primary: '',
        fallbacks: [],
      },
      models: {},
      workspace: '~/.openclaw/workspace',
      imageMaxDimensionPx: 1200,
      compaction: {
        mode: 'default',
      },
      heartbeat: {
        every: '30m',
        suppressToolErrorWarnings: false,
      },
    },
    list: [],
  },
  messages: {
    queue: {
      mode: 'collect',
    },
  },
  channels: {
    whatsapp: { enabled: false, dmPolicy: 'pairing', allowFrom: [] },
    telegram: { enabled: false, botToken: '', dmPolicy: 'pairing', allowFrom: [] },
    discord: { enabled: false, botToken: '', applicationId: '', dmPolicy: 'pairing', allowFrom: [] },
    slack: { enabled: false, botToken: '', appToken: '', dmPolicy: 'pairing', allowFrom: [] },
    signal: { enabled: false, dmPolicy: 'pairing' },
    imessage: { enabled: false, dmPolicy: 'pairing' },
    googlechat: { enabled: false, dmPolicy: 'pairing' },
    mattermost: { enabled: false, url: '', token: '', dmPolicy: 'pairing' },
    msteams: { enabled: false, dmPolicy: 'pairing' },
    bluebubbles: { enabled: false, dmPolicy: 'pairing' },
    matrix: { enabled: false, dmPolicy: 'pairing' },
    zalo: { enabled: false, dmPolicy: 'pairing' },
    webchat: { enabled: false, dmPolicy: 'pairing' },
  },
  gateway: {
    mode: 'local',
    port: 18789,
    bind: 'loopback',
    auth: {
      mode: 'token',
    },
    tailscale: {
      mode: 'off',
    },
  },
  session: {
    dmScope: 'main',
  },
  browser: {
    enabled: true,
    defaultProfile: 'chrome',
    headless: false,
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true,
    },
  },
  env: {},
  tools: {
    deny: [],
  },
}

const initialState = {
  currentStep: 0,
  completedSteps: [],
  selectedUseCase: null,
  selectedTemplate: null,
  config: { ...defaultConfig },
  soulMd: '',
  workspaceFiles: {
    'AGENTS.md': '',
    'BOOT.md': '',
    'BOOTSTRAP.md': '',
    'HEARTBEAT.md': '',
    'IDENTITY': '',
    'SOUL.md': '',
    'TOOLS.md': '',
    'USER': '',
  },
  provider: 'anthropic',
  apiKey: '',
  skippedFields: [],
  theme: 'dark', // Add theme state
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return deepMerge(initialState, parsed)
    }
  } catch (e) { /* ignore */ }
  return initialState
}

function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

function wizardReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'COMPLETE_STEP': {
      const set = new Set(state.completedSteps)
      set.add(action.payload)
      return { ...state, completedSteps: [...set] }
    }
    case 'SET_USE_CASE':
      return { ...state, selectedUseCase: action.payload }
    case 'SET_TEMPLATE':
      return { ...state, selectedTemplate: action.payload }
    case 'SET_PROVIDER':
      return { ...state, provider: action.payload }
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload }
    case 'SET_SOUL_MD':
      return { 
        ...state, 
        soulMd: action.payload,
        workspaceFiles: { ...state.workspaceFiles, 'SOUL.md': action.payload }
      }
    case 'SET_WORKSPACE_FILE':
      return {
        ...state,
        workspaceFiles: { ...state.workspaceFiles, [action.payload.name]: action.payload.content },
        // Keep soulMd in sync if SOUL.md is edited
        soulMd: action.payload.name === 'SOUL.md' ? action.payload.content : state.soulMd
      }
    case 'SET_ALL_WORKSPACE_FILES':
      return {
        ...state,
        workspaceFiles: { ...state.workspaceFiles, ...action.payload },
        soulMd: action.payload['SOUL.md'] || state.soulMd
      }
    case 'UPDATE_CONFIG':
      return { ...state, config: deepMerge(state.config, action.payload) }
    case 'SET_CHANNEL': {
      const { channel, data } = action.payload
      return {
        ...state,
        config: {
          ...state.config,
          channels: {
            ...state.config.channels,
            [channel]: { ...state.config.channels[channel], ...data },
          },
        },
      }
    }
    case 'SET_GATEWAY':
      return {
        ...state,
        config: {
          ...state.config,
          gateway: { ...state.config.gateway, ...action.payload },
        },
      }
    case 'SKIP_FIELD': {
      const set = new Set(state.skippedFields)
      set.add(action.payload)
      return { ...state, skippedFields: [...set] }
    }
    case 'UNSKIP_FIELD': {
      return { ...state, skippedFields: state.skippedFields.filter(f => f !== action.payload) }
    }
    case 'APPLY_TEMPLATE':
      return {
        ...state,
        config: deepMerge(defaultConfig, action.payload.config),
        selectedTemplate: action.payload.id,
        soulMd: action.payload.soulMd || state.soulMd,
      }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}



const WizardContext = createContext(null)

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, null, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const nextStep = () => {
    dispatch({ type: 'COMPLETE_STEP', payload: state.currentStep })
    dispatch({ type: 'SET_STEP', payload: Math.min(state.currentStep + 1, STEPS.length - 1) })
  }

  const prevStep = () => {
    dispatch({ type: 'SET_STEP', payload: Math.max(state.currentStep - 1, 0) })
  }

  const goToStep = (index) => {
    if (index <= Math.max(...state.completedSteps, state.currentStep)) {
      dispatch({ type: 'SET_STEP', payload: index })
    }
  }

  const generateConfig = () => {
    const cfg = JSON.parse(JSON.stringify(state.config))

    // ═══ SCHEMA MIGRATION — fix old localStorage values ═══

    // 1. compaction: must be object { mode: "default"|"safeguard" }, not boolean
    if (cfg.agents?.defaults) {
      if (typeof cfg.agents.defaults.compaction === 'boolean' || cfg.agents.defaults.compaction === undefined) {
        cfg.agents.defaults.compaction = { mode: 'default' }
      }
      // Remove keys not in official schema
      delete cfg.agents.defaults.timeoutSeconds
      delete cfg.agents.defaults.blockStreamingDefault
      // heartbeat.model empty string is invalid — remove it
      if (cfg.agents.defaults.heartbeat?.model === '') {
        delete cfg.agents.defaults.heartbeat.model
      }
    }

    // 2. tools: "disabled" key is not valid — migrate to "deny"
    if (cfg.tools) {
      if (cfg.tools.disabled) {
        cfg.tools.deny = cfg.tools.disabled
        delete cfg.tools.disabled
      }
    }

    // 3. session.dmScope: valid values are "main"|"per-peer"|"per-channel-peer"|"per-account-channel-peer"
    const validDmScopes = ['main', 'per-peer', 'per-channel-peer', 'per-account-channel-peer']
    if (cfg.session && !validDmScopes.includes(cfg.session.dmScope)) {
      cfg.session.dmScope = 'main'
    }

    // 4. gateway.bind: valid values are "loopback"|"lan"|"tailnet"|"auto" (not IP addresses)
    const validBinds = ['loopback', 'lan', 'tailnet', 'auto']
    if (cfg.gateway && !validBinds.includes(cfg.gateway.bind)) {
      // Map old IP values to correct enum
      if (cfg.gateway.bind === '127.0.0.1' || cfg.gateway.bind === 'localhost') {
        cfg.gateway.bind = 'loopback'
      } else if (cfg.gateway.bind === '0.0.0.0') {
        cfg.gateway.bind = 'lan'
      } else {
        cfg.gateway.bind = 'loopback'
      }
    }
    // Remove empty auth.token (auto-generated by openclaw)
    if (cfg.gateway?.auth?.token === '') {
      delete cfg.gateway.auth.token
    }

    // 5. Remove invalid root-level keys
    delete cfg.sessionRetention
    delete cfg.imageMaxDimensionPx

    // 6. Remove groupPolicy from channels (not a valid key)
    for (const ch of Object.values(cfg.channels || {})) {
      delete ch.groupPolicy
    }

    // 7. Remove extra queue keys that aren't in schema
    if (cfg.messages?.queue) {
      delete cfg.messages.queue.debounceMs
      delete cfg.messages.queue.cap
      delete cfg.messages.queue.drop
    }

    // ═══ END MIGRATION ═══

    // Set provider API key in env
    if (state.apiKey && state.provider) {
      const envKey = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
        google: 'GEMINI_API_KEY',
        kilocode: 'KILO_API_KEY',
        groq: 'GROQ_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        xai: 'XAI_API_KEY',
        together: 'TOGETHER_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        moonshot: 'MOONSHOT_API_KEY',
        minimax: 'MINIMAX_API_KEY',
        venice: 'VENICE_API_KEY',
        opencode: 'OPENCODE_API_KEY',
        synthetic: 'SYNTHETIC_API_KEY',
      }[state.provider]
      if (envKey) {
        cfg.env = { ...cfg.env, [envKey]: state.apiKey }
      }
    }

    // Remove disabled channels (keep only enabled ones without the 'enabled' flag)
    const channels = {}
    for (const [key, val] of Object.entries(cfg.channels)) {
      if (val.enabled) {
        const { enabled, ...rest } = val
        channels[key] = rest
      }
    }
    cfg.channels = channels

    // Clean up tools: remove empty deny array
    if (cfg.tools?.deny?.length === 0) {
      delete cfg.tools.deny
    }
    if (cfg.tools && Object.keys(cfg.tools).length === 0) {
      delete cfg.tools
    }

    // Clean up browser: remove internal 'enabled' flag
    if (cfg.browser) {
      delete cfg.browser.enabled
    }

    // Clean up env: remove if empty
    if (cfg.env && Object.keys(cfg.env).length === 0) {
      delete cfg.env
    }

    // Clean up empty agents.list
    if (cfg.agents?.list?.length === 0) {
      delete cfg.agents.list
    }

    // Clean up empty models
    if (cfg.agents?.defaults?.models && Object.keys(cfg.agents.defaults.models).length === 0) {
      delete cfg.agents.defaults.models
    }

    return cfg
  }

  return (
    <WizardContext.Provider value={{
      state, dispatch, STEPS,
      nextStep, prevStep, goToStep, generateConfig,
    }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}

export { STEPS }
