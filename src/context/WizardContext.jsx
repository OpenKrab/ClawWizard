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
      heartbeat: {
        every: '30m',
        model: '',
        suppressToolErrorWarnings: false,
      },
    },
    list: [],
  },
  channels: {
    whatsapp: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist', allowFrom: [] },
    telegram: { enabled: false, botToken: '', dmPolicy: 'pairing', groupPolicy: 'allowlist', allowFrom: [] },
    discord: { enabled: false, botToken: '', applicationId: '', dmPolicy: 'pairing', groupPolicy: 'allowlist', allowFrom: [] },
    slack: { enabled: false, botToken: '', appToken: '', dmPolicy: 'pairing', groupPolicy: 'allowlist', allowFrom: [] },
    signal: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    imessage: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    googlechat: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    mattermost: { enabled: false, url: '', token: '', dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    msteams: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    bluebubbles: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    matrix: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    zalo: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
    webchat: { enabled: false, dmPolicy: 'pairing', groupPolicy: 'allowlist' },
  },
  gateway: {
    port: 18789,
    bind: '127.0.0.1',
    auth: {
      mode: 'token',
      token: '',
    },
    tailscale: {
      mode: 'off',
    },
  },
  env: {},
  tools: {
    disabled: [],
  },
  sessionRetention: '7d',
  imageMaxDimensionPx: 1024,
}

const initialState = {
  currentStep: 0,
  completedSteps: [],
  selectedUseCase: null,
  selectedTemplate: null,
  config: { ...defaultConfig },
  soulMd: '',
  provider: 'anthropic',
  apiKey: '',
  skippedFields: [],
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...initialState, ...parsed }
    }
  } catch (e) { /* ignore */ }
  return initialState
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
      return { ...state, soulMd: action.payload }
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
    case 'TOGGLE_TOOL_DISABLED': {
      const tool = action.payload
      const disabled = state.config.tools.disabled.includes(tool)
        ? state.config.tools.disabled.filter(t => t !== tool)
        : [...state.config.tools.disabled, tool]
      return {
        ...state,
        config: { ...state.config, tools: { ...state.config.tools, disabled } },
      }
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
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
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
    const cfg = { ...state.config }

    // Set model
    if (state.apiKey && state.provider) {
      const envKey = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
        google: 'GOOGLE_API_KEY',
        kilocode: 'KILOCODE_API_KEY',
        groq: 'GROQ_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        xai: 'XAI_API_KEY',
        together: 'TOGETHER_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        cerebras: 'CEREBRAS_API_KEY',
        moonshot: 'MOONSHOT_API_KEY',
        minimax: 'MINIMAX_API_KEY',
      }[state.provider]
      if (envKey) {
        cfg.env = { ...cfg.env, [envKey]: state.apiKey }
      }
    }

    // Remove disabled channels
    const channels = {}
    for (const [key, val] of Object.entries(cfg.channels)) {
      if (val.enabled) {
        const { enabled, ...rest } = val
        channels[key] = rest
      }
    }
    cfg.channels = channels

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
