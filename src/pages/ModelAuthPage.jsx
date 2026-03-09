import { useState, useEffect, useMemo, useRef } from 'react'
import { useWizard } from '../context/WizardContext'
import { MODEL_PROVIDERS } from '../data/templates'
import allModelsSeed from '../data/all_models.json'

const MANUAL_EXPORT_URL = '/models-export.local.json'
const CANONICAL_OPENCLAW_AUTH_CHOICES = new Set([
  'oauth',
  'setup-token',
  'claude-cli',
  'token',
  'chutes',
  'vllm',
  'openai-codex',
  'openai-api-key',
  'openrouter-api-key',
  'kilocode-api-key',
  'litellm-api-key',
  'ai-gateway-api-key',
  'cloudflare-ai-gateway-api-key',
  'moonshot-api-key',
  'moonshot-api-key-cn',
  'kimi-code-api-key',
  'synthetic-api-key',
  'venice-api-key',
  'together-api-key',
  'huggingface-api-key',
  'codex-cli',
  'apiKey',
  'gemini-api-key',
  'google-gemini-cli',
  'zai-api-key',
  'zai-coding-global',
  'zai-coding-cn',
  'zai-global',
  'zai-cn',
  'xiaomi-api-key',
  'minimax-cloud',
  'minimax',
  'minimax-api',
  'minimax-api-key-cn',
  'minimax-api-lightning',
  'minimax-portal',
  'opencode-zen',
  'github-copilot',
  'copilot-proxy',
  'qwen-portal',
  'xai-api-key',
  'mistral-api-key',
  'volcengine-api-key',
  'byteplus-api-key',
  'qianfan-api-key',
  'custom-api-key',
  'skip',
])

const PROVIDER_DOC_PATH_MAP = {
  anthropic: 'anthropic',
  'claude-max-proxy': 'claude-max-api-proxy',
  'amazon-bedrock': 'bedrock',
  'cloudflare-ai-gateway': 'cloudflare-ai-gateway',
  deepgram: 'deepgram',
  'github-copilot': 'github-copilot',
  huggingface: 'hugging-face',
  kilocode: 'kilocode',
  litellm: 'litellm',
  glm: 'glm',
  minimax: 'minimax',
  moonshot: 'moonshot',
  mistral: 'mistral',
  nvidia: 'nvidia',
  ollama: 'ollama',
  openai: 'openai',
  opencode: 'opencode',
  openrouter: 'openrouter',
  qianfan: 'qianfan',
  qwen: 'qwen',
  synthetic: 'synthetic',
  together: 'together',
  'vercel-ai-gateway': 'vercel-ai-gateway',
  venice: 'venice',
  vllm: 'vllm',
  xiaomi: 'xiaomi',
  zai: 'z-ai',
}

const normalizeCatalogModel = (model) => {
  const id = model.key || model.id || ''
  return {
    id,
    provider: id.split('/')[0] || 'unknown',
    input: model.input || 'text',
    context: model.contextWindow ? `${Math.round(model.contextWindow / 1024)}k` : '-',
    local: !!model.local,
    auth: !!model.available,
    tags: Array.isArray(model.tags) ? model.tags.join(', ') : (model.tags || ''),
    free: id.includes(':free') || id.includes('-free'),
  }
}

const SEED_MODELS = (allModelsSeed.models || []).map(normalizeCatalogModel)
const SEED_MODELS_BY_PROVIDER = SEED_MODELS.reduce((acc, model) => {
  if (!acc[model.provider]) acc[model.provider] = []
  acc[model.provider].push(model)
  return acc
}, {})

const summarizeProviders = (models) => {
  const byProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = []
    acc[model.provider].push(model)
    return acc
  }, {})

  return Object.entries(byProvider)
    .map(([id, items]) => ({
      id,
      count: items.length,
      authed: items.filter(model => model.auth).length,
      freeCount: items.filter(model => model.free).length,
    }))
    .sort((a, b) => b.authed - a.authed || b.count - a.count || a.id.localeCompare(b.id))
}

const SEED_PROVIDER_SUMMARY = summarizeProviders(SEED_MODELS)
const SEED_PROVIDER_IDS = new Set(Object.keys(SEED_MODELS_BY_PROVIDER))
const TEMPLATE_PROVIDER_IDS = new Set(MODEL_PROVIDERS.map(provider => provider.id))
const MODEL_PROVIDER_PREFIX_ALIASES = {
  'openai-codex': ['openai', 'github-copilot'],
  'kimi-coding': ['moonshot'],
}

const formatProviderName = (providerId) => providerId
  .split('-')
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const normalizeCatalogPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.models) ? payload.models : [])

  const models = list
    .map((model) => {
      if (model?.id && model?.provider) {
        return {
          id: model.id,
          provider: model.provider,
          input: model.input || 'text',
          context: model.context || '-',
          local: !!model.local,
          auth: !!model.auth,
          tags: model.tags || '',
          free: !!model.free,
        }
      }

      return normalizeCatalogModel(model)
    })
    .filter(model => model.id)

  const providers = Array.isArray(payload?.providers) && payload.providers.length > 0
    ? payload.providers.map((provider) => ({
        id: provider.id,
        count: provider.count || 0,
        authed: provider.authed || 0,
        freeCount: provider.freeCount || 0,
      }))
    : summarizeProviders(models)

  return { models, providers }
}

const hasCanonicalCliAuthSupport = (provider) => {
  if (!provider) return false

  if (provider.authChoice && CANONICAL_OPENCLAW_AUTH_CHOICES.has(provider.authChoice)) {
    return true
  }

  return Array.isArray(provider.authOptions) && provider.authOptions.some(option => CANONICAL_OPENCLAW_AUTH_CHOICES.has(option.id))
}

const providerSupportsAuthChoice = (provider, authChoice) => {
  if (!provider || !authChoice) return false
  if (provider.authChoice === authChoice) return true
  return Array.isArray(provider.authOptions) && provider.authOptions.some(option => option.id === authChoice)
}

const resolveProviderFromModelId = ({ modelId, providerList, currentProviderId, currentAuthChoice }) => {
  const prefix = (modelId || '').split('/')[0]?.trim()
  if (!prefix) return null

  const exactProvider = providerList.find(provider => provider.id === prefix)
  if (exactProvider) return exactProvider.id

  const aliasCandidates = MODEL_PROVIDER_PREFIX_ALIASES[prefix] || []
  if (aliasCandidates.length === 0) return null

  const candidateProviders = aliasCandidates
    .map(candidateId => providerList.find(provider => provider.id === candidateId))
    .filter(Boolean)

  if (currentAuthChoice) {
    const authMatched = candidateProviders.find(provider => providerSupportsAuthChoice(provider, currentAuthChoice))
    if (authMatched) return authMatched.id
  }

  if (currentProviderId) {
    const currentMatched = candidateProviders.find(provider => provider.id === currentProviderId)
    if (currentMatched) return currentMatched.id
  }

  const modelMatched = candidateProviders.find((provider) => provider.models?.includes(modelId))
  if (modelMatched) return modelMatched.id

  return candidateProviders[0]?.id || null
}

export default function ModelAuthPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [showKey, setShowKey] = useState(false)
  const [allModels, setAllModels] = useState([])
  const [dynamicProviders, setDynamicProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFree, setFilterFree] = useState(false)
  const [catalogSource, setCatalogSource] = useState('loading')
  const [showProviderBrowser, setShowProviderBrowser] = useState(false)
  const [showModelBrowser, setShowModelBrowser] = useState(false)
  const [authRunning, setAuthRunning] = useState(false)
  const [authLogs, setAuthLogs] = useState([])
  const [authDone, setAuthDone] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  const authLogRef = useRef(null)

  // Fetch ALL models once on mount
  useEffect(() => {
    fetchAllModels()
  }, [])

  const fetchAllModels = async (refresh = false) => {
    setLoading(true)
    try {
      try {
        const manualRes = await fetch(`${MANUAL_EXPORT_URL}${refresh ? `?t=${Date.now()}` : ''}`)
        if (manualRes.ok) {
          const manualData = await manualRes.json()
          const normalizedManual = normalizeCatalogPayload(manualData)
          if (normalizedManual.models.length > 0) {
            setAllModels(normalizedManual.models)
            setDynamicProviders(normalizedManual.providers)
            setCatalogSource('manual')
            return
          }
        }
      } catch {}

      // WEB Bridge fetch
      const url = refresh ? '/api/models?refresh=1' : '/api/models'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Model API returned ${res.status}`)
      const data = await res.json()
      const normalized = normalizeCatalogPayload(data)
      setAllModels(normalized.models)
      setDynamicProviders(normalized.providers)
      setCatalogSource('live')
    } catch {
      // Fallback to bundled catalog when bridge/live CLI is unavailable.
      setAllModels(SEED_MODELS)
      setDynamicProviders(SEED_PROVIDER_SUMMARY)
      setCatalogSource('seed')
    } finally {
      setLoading(false)
    }
  }

  // Merge dynamic providers with hardcoded ones  
  const providerList = useMemo(() => {
    const seen = new Set()
    const merged = []
    const providerSummaries = dynamicProviders.length > 0 ? dynamicProviders : SEED_PROVIDER_SUMMARY
    const dynamicProviderIds = new Set(providerSummaries.map(provider => provider.id))

    const buildSourceFlags = (providerId) => ({
      catalog: dynamicProviderIds.has(providerId),
      seed: SEED_PROVIDER_IDS.has(providerId),
      template: TEMPLATE_PROVIDER_IDS.has(providerId),
    })

    const pushProvider = (providerSummary) => {
      if (!providerSummary?.id || seen.has(providerSummary.id)) return

      seen.add(providerSummary.id)
      const tpl = MODEL_PROVIDERS.find(p => p.id === providerSummary.id)
      merged.push({
        id: providerSummary.id,
        name: tpl?.name || formatProviderName(providerSummary.id),
        icon: tpl?.icon || '🔌',
        count: providerSummary.count || 0,
        authed: providerSummary.authed || 0,
        freeCount: providerSummary.freeCount || 0,
        consoleUrl: tpl?.consoleUrl || '',
        keyPattern: tpl?.keyPattern || null,
        envKey: tpl?.envKey || '',
        authOptions: tpl?.authOptions || [],
        authChoice: tpl?.authChoice || '',
        sourceFlags: buildSourceFlags(providerSummary.id),
        cliAuthSupported: hasCanonicalCliAuthSupport(tpl),
      })
    }

    // Prefer provider summaries from live CLI, otherwise from bundled seed catalog.
    for (const providerSummary of providerSummaries) {
      pushProvider(providerSummary)
    }

    // Ensure seed-only providers are still visible even when live/provider summary is partial.
    for (const providerSummary of SEED_PROVIDER_SUMMARY) {
      pushProvider(providerSummary)
    }

    // Add remaining hardcoded providers not in CLI
    for (const tpl of MODEL_PROVIDERS) {
      if (!seen.has(tpl.id)) {
        const fallbackModels = SEED_MODELS_BY_PROVIDER[tpl.id] || []
        merged.push({
          id: tpl.id,
          name: tpl.name,
          icon: tpl.icon,
          count: fallbackModels.length || tpl.models?.length || 0,
          authed: 0,
          freeCount: fallbackModels.filter(m => m.free).length,
          consoleUrl: tpl.consoleUrl || '',
          keyPattern: tpl.keyPattern || null,
          envKey: tpl.envKey || '',
          authOptions: tpl.authOptions || [],
          authChoice: tpl.authChoice || '',
          sourceFlags: buildSourceFlags(tpl.id),
          cliAuthSupported: hasCanonicalCliAuthSupport(tpl),
        })
      }
    }
    return merged
  }, [dynamicProviders])

  const visibleModelCount = allModels.length > 0 ? allModels.length : SEED_MODELS.length
  const visibleProviderCount = providerList.length
  const catalogSourceLabel = {
    loading: 'Loading catalog...',
    manual: 'Using local exported JSON override',
    live: 'Using live bridge catalog',
    seed: 'Using bundled seed catalog',
  }[catalogSource]

  const currentProviderInfo = providerList.find(p => p.id === state.provider) || providerList[0]
  const currentProviderSourceLabel = currentProviderInfo?.sourceFlags?.catalog
    ? 'Current catalog'
    : currentProviderInfo?.sourceFlags?.seed
      ? 'Bundled seed fallback'
      : currentProviderInfo?.sourceFlags?.template
        ? 'Template fallback'
        : 'Unknown source'
  const providerDocsPath = PROVIDER_DOC_PATH_MAP[state.provider]
  const providerDocsUrl = providerDocsPath ? `https://docs.openclaw.ai/providers/${providerDocsPath}` : ''
  const currentAuthOption = currentProviderInfo?.authOptions?.find(option => option.id === (state.authChoice || currentProviderInfo?.authChoice)) || currentProviderInfo?.authOptions?.[0]
  const oauthOptions = (currentProviderInfo?.authOptions || []).filter(option => option.isOAuth && CANONICAL_OPENCLAW_AUTH_CHOICES.has(option.id))
  const usesOAuth = !!currentAuthOption?.isOAuth && CANONICAL_OPENCLAW_AUTH_CHOICES.has(currentAuthOption.id)
  const hasOAuthSupport = currentProviderInfo?.cliAuthSupported && oauthOptions.length > 0

  const needsApiKey = !!currentProviderInfo?.envKey && state.provider !== 'ollama' && !usesOAuth
  const keyValid = !needsApiKey || !!state.apiKey || state.skippedFields.includes('apiKey')
  const modelSet = !!state.config.agents.defaults.model.primary

  const resetAuthFlow = () => {
    setAuthRunning(false)
    setAuthLogs([])
    setAuthDone(false)
    setAuthError(false)
    setAuthUrl('')
    dispatch({ type: 'UNSKIP_FIELD', payload: 'oauth' })
  }

  const handleStartAuth = async () => {
    if (!currentAuthOption?.id) return

    setAuthRunning(true)
    setAuthLogs([])
    setAuthDone(false)
    setAuthError(false)
    setAuthUrl('')

    try {
      const res = await fetch('/api/auth-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authChoice: currentAuthOption.id }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No auth stream returned')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'url') setAuthUrl(data.url)
            if (data.type === 'done') {
              setAuthDone(data.success)
              setAuthError(!data.success)
              setAuthRunning(false)
            }
            if (data.type === 'error') {
              setAuthError(true)
              setAuthRunning(false)
            }
            if (data.msg) setAuthLogs(prev => [...prev.slice(-100), data.msg])
          } catch {}
        }
      }
    } catch (error) {
      setAuthLogs(prev => [...prev, `❌ Connection error: ${error.message}`])
      setAuthError(true)
      setAuthRunning(false)
    }
  }

  const handleCancelAuth = async () => {
    try {
      await fetch('/api/auth-cancel', { method: 'POST' })
    } catch {}
    setAuthRunning(false)
  }

  useEffect(() => {
    if (authLogRef.current) {
      authLogRef.current.scrollTop = authLogRef.current.scrollHeight
    }
  }, [authLogs])

  // Models for selected provider
  const providerCatalog = useMemo(() => {
    const liveModels = allModels.filter(m => m.provider === state.provider)
    if (liveModels.length > 0) return liveModels

    const seedModels = SEED_MODELS_BY_PROVIDER[state.provider]
    if (seedModels?.length) return seedModels

    const tpl = MODEL_PROVIDERS.find(p => p.id === state.provider)
    if (tpl?.models?.length) {
      return tpl.models.map(id => ({
        id,
        provider: state.provider,
        input: 'text',
        context: '-',
        local: false,
        auth: false,
        tags: '',
        free: false,
      }))
    }

    return []
  }, [allModels, state.provider])

  const providerCatalogSource = useMemo(() => {
    if (allModels.some(model => model.provider === state.provider)) return 'Current catalog'
    if (SEED_MODELS_BY_PROVIDER[state.provider]?.length) return 'Bundled seed fallback'
    const tpl = MODEL_PROVIDERS.find(provider => provider.id === state.provider)
    if (tpl?.models?.length) return 'Template fallback'
    return 'Unknown source'
  }, [allModels, state.provider])

  const providerModels = useMemo(() => {
    let models = [...providerCatalog]
    if (filterFree) models = models.filter(m => m.free)
    if (searchQuery) models = models.filter(m => m.id.toLowerCase().includes(searchQuery.toLowerCase()))
    return models
  }, [providerCatalog, filterFree, searchQuery])

  const suggestedModels = useMemo(() => providerCatalog.slice(0, 6), [providerCatalog])

  const freeCount = providerCatalog.filter(m => m.free).length

  const syncProviderFromModelId = (modelId) => {
    const providerId = resolveProviderFromModelId({
      modelId,
      providerList,
      currentProviderId: state.provider,
      currentAuthChoice: state.authChoice,
    })
    if (!providerId) return

    const providerInfo = providerList.find(provider => provider.id === providerId)
    if (!providerInfo || state.provider === providerId) return

    dispatch({ type: 'SET_PROVIDER', payload: providerId })
    dispatch({ type: 'SET_AUTH_CHOICE', payload: providerInfo.authChoice || '' })
    dispatch({ type: 'UNSKIP_FIELD', payload: 'apiKey' })
    resetAuthFlow()
    setSearchQuery('')
    setFilterFree(false)
  }

  const handleAuthChoiceChange = (authChoiceId) => {
    dispatch({ type: 'SET_AUTH_CHOICE', payload: authChoiceId })
    dispatch({ type: 'UNSKIP_FIELD', payload: 'apiKey' })
    resetAuthFlow()
  }

  const handleProviderChange = (providerId) => {
    dispatch({ type: 'SET_PROVIDER', payload: providerId })
    const providerInfo = providerList.find(p => p.id === providerId)
    dispatch({ type: 'SET_AUTH_CHOICE', payload: providerInfo?.authChoice || '' })
    dispatch({ type: 'UNSKIP_FIELD', payload: 'apiKey' })
    resetAuthFlow()
    setSearchQuery('')
    setFilterFree(false)
    // Auto-select first authed model for convenience
    const firstAuthed = allModels.find(m => m.provider === providerId && m.auth)
    if (firstAuthed) {
      dispatch({ type: 'UPDATE_CONFIG', payload: { agents: { defaults: { model: { primary: firstAuthed.id } } } } })
    }
  }

  const handleModelSelect = (modelId) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: { agents: { defaults: { model: { primary: modelId } } } } })
    syncProviderFromModelId(modelId)
  }

  const oauthValid = !usesOAuth || authDone || state.skippedFields.includes('oauth')
  const canContinue = modelSet && keyValid && oauthValid

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Model & Auth</h1>
        <p className="page-subtitle">
          Manual model input is the primary path. Provider presets and catalog browsing are optional helpers.
          {!loading && <span style={{ color: 'var(--text-tertiary)' }}> {visibleModelCount} models across {visibleProviderCount} providers</span>}
        </p>
        {!loading && (
          <p className="field-hint" style={{ marginTop: '8px' }}>
            {catalogSourceLabel}
            {catalogSource === 'manual' && ` (${MANUAL_EXPORT_URL})`}
          </p>
        )}
        {!loading && (
          <p className="field-hint" style={{ marginTop: '4px' }}>
            `Cat` = found in current exported/live catalog, `Auth` = current OpenClaw CLI has onboarding/auth support, `Seed` = from bundled all_models.json, `Tpl` = hardcoded template only.
          </p>
        )}
      </div>

      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <div>
            <h3 className="form-section-title" style={{ marginBottom: '4px' }}>✍️ Manual Model Input</h3>
            <p className="field-hint">Recommended. Paste the exact model id you want OpenClaw to use.</p>
          </div>
          {state.provider && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleModelSelect(`${state.provider}/`)}
              type="button"
            >
              Use {state.provider}/ prefix
            </button>
          )}
        </div>

        <input
          className="field-input mono"
          type="text"
          placeholder={`e.g. ${state.provider || 'openai'}/model-name`}
          value={state.config.agents.defaults.model.primary}
          onChange={(e) => handleModelSelect(e.target.value)}
          style={{ fontSize: '13px' }}
        />

        <p className="field-hint" style={{ marginTop: '8px' }}>
          Selected: <strong style={{ color: 'var(--text-accent)' }}>{state.config.agents.defaults.model.primary || 'none'}</strong>
        </p>

        <p className="field-hint" style={{ marginTop: '4px' }}>
          Enter a model id first. For providers with supported browser login, you can switch to OAuth below.
        </p>

        {suggestedModels.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <p className="field-hint" style={{ marginBottom: '8px' }}>
              Example model ids from {currentProviderInfo?.name || state.provider || 'the current provider'}:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedModels.map((model) => (
                <button
                  key={model.id}
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleModelSelect(model.id)}
                  type="button"
                >
                  {model.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentProviderInfo?.authOptions?.length > 1 && (
        <div className="form-section">
          <h3 className="form-section-title">🔐 Auth Method</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-md)' }}>
            Only canonical OpenClaw auth methods are shown here. OAuth is enabled only for providers supported by the CLI wizard.
          </p>
          <div className="card-grid card-grid-2">
            {currentProviderInfo.authOptions
              .filter(option => !option.isOAuth || CANONICAL_OPENCLAW_AUTH_CHOICES.has(option.id))
              .map(option => {
                const active = option.id === (state.authChoice || currentProviderInfo.authChoice)
                const disabled = option.isOAuth && !currentProviderInfo.cliAuthSupported
                return (
                  <div
                    key={option.id}
                    className={`glass-card clickable animate-scale ${active ? 'selected' : ''}`}
                    onClick={() => !disabled && handleAuthChoiceChange(option.id)}
                    style={{
                      padding: 'var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      opacity: disabled ? 0.5 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>{option.icon || '🔑'}</div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{option.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{option.description}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div>
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>🏢 Provider Preset</h3>
            <p className="field-hint" style={{ marginTop: '4px' }}>Optional. Use this only to prefill auth settings, docs, and example model ids.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {providerDocsUrl && (
              <a
                href={providerDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: 'none' }}
              >
                📘 Docs
              </a>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowProviderBrowser(!showProviderBrowser)}
              type="button"
            >
              {showProviderBrowser ? 'Hide presets' : 'Browse presets'}
            </button>
          </div>
        </div>
        <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: showProviderBrowser ? 'var(--space-md)' : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{currentProviderInfo?.name || state.provider || 'No preset selected'}</div>
              <div className="field-hint" style={{ marginTop: '4px' }}>
                Provider source: {currentProviderSourceLabel}. Models shown from: {providerCatalogSource}. In current catalog: {currentProviderInfo?.sourceFlags?.catalog ? 'yes' : 'no'}. CLI auth/onboarding support: {currentProviderInfo?.cliAuthSupported ? 'yes' : 'no'}.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {currentProviderInfo?.sourceFlags?.catalog && <span className="badge badge-success" style={{ fontSize: '9px' }}>Cat</span>}
              {currentProviderInfo?.cliAuthSupported && <span className="badge badge-success" style={{ fontSize: '9px' }}>Auth</span>}
              {currentProviderInfo?.sourceFlags?.seed && <span className="badge badge-default" style={{ fontSize: '9px' }}>Seed</span>}
              {!currentProviderInfo?.sourceFlags?.catalog && currentProviderInfo?.sourceFlags?.template && <span className="badge badge-default" style={{ fontSize: '9px' }}>Tpl</span>}
            </div>
          </div>
        </div>

        {showProviderBrowser && (
          <div className="card-grid card-grid-3">
            {loading && dynamicProviders.length === 0 ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card skeleton" style={{ height: '80px' }} />
              ))
            ) : (
              providerList.map((provider) => (
                <div
                  key={provider.id}
                  className={`glass-card clickable animate-scale ${state.provider === provider.id ? 'selected' : ''}`}
                  onClick={() => handleProviderChange(provider.id)}
                  style={{ padding: 'var(--space-md)', textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '24px' }}>{provider.icon}</span>
                  <h4 style={{ fontSize: '13px', fontWeight: 700 }}>{provider.name}</h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {provider.sourceFlags?.catalog && <span className="badge badge-success" style={{ fontSize: '9px' }}>Cat</span>}
                    {provider.cliAuthSupported && <span className="badge badge-success" style={{ fontSize: '9px' }}>Auth</span>}
                    {provider.sourceFlags?.seed && <span className="badge badge-default" style={{ fontSize: '9px' }}>Seed</span>}
                    {!provider.sourceFlags?.catalog && provider.sourceFlags?.template && <span className="badge badge-default" style={{ fontSize: '9px' }}>Tpl</span>}
                  </div>
                  {provider.count > 0 && (
                    <span style={{ fontSize: '10px', color: provider.authed > 0 ? 'var(--status-success)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                      {provider.count} models {provider.authed > 0 && `(${provider.authed} ✓)`}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div>
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>
              🤖 Catalog Browser
            </h3>
            <p className="field-hint" style={{ marginTop: '4px' }}>Optional helper. Use this only when you want to browse or copy a model id.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            {freeCount > 0 && (
              <button className={`btn btn-sm ${filterFree ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterFree(!filterFree)}>
                🆓 Free ({freeCount})
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => fetchAllModels(true)} disabled={loading} type="button">
              {loading ? <span className="animate-pulse">🔄</span> : '🔄'} Refresh
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowModelBrowser(!showModelBrowser)} type="button">
              {showModelBrowser ? 'Hide catalog' : 'Browse catalog'}
            </button>
          </div>
        </div>
        {!loading && currentProviderInfo && (
          <p className="field-hint" style={{ marginBottom: 'var(--space-sm)' }}>
            Current provider: {currentProviderInfo.name}. Source: {providerCatalogSource}. {providerModels.length} visible model ids.
          </p>
        )}

        {showModelBrowser && (providerModels.length > 5 || loading) && (
          <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
            <input
              className={`field-input ${loading ? 'skeleton' : ''}`}
              type="text"
              placeholder="🔍 Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        )}

        {/* Model List */}
        {showModelBrowser && loading && allModels.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: '40px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : showModelBrowser && providerModels.length > 0 ? (
          <div style={{ 
            maxHeight: '320px', 
            overflowY: 'auto', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
          }}>
            {providerModels.map(m => (
              <div
                key={m.id}
                onClick={() => handleModelSelect(m.id)}
                className={`animate-in`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                  padding: '12px 16px', cursor: 'pointer',
                  background: state.config.agents.defaults.model.primary === m.id ? 'rgba(255,107,53,0.15)' : 'transparent',
                  borderBottom: '1px solid var(--glass-border)',
                  opacity: m.auth ? 1 : 0.6,
                  transition: 'all 0.2s',
                  borderLeft: state.config.agents.defaults.model.primary === m.id ? '4px solid var(--accent-start)' : '4px solid transparent'
                }}
              >
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  background: state.config.agents.defaults.model.primary === m.id ? 'var(--accent-start)' : 'transparent',
                  border: state.config.agents.defaults.model.primary === m.id ? 'none' : '2px solid var(--glass-border)',
                }} />
                <span style={{ 
                  flex: 1, 
                  fontSize: '13px', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: state.config.agents.defaults.model.primary === m.id ? 600 : 400,
                  color: state.config.agents.defaults.model.primary === m.id ? 'var(--text-primary)' : 'var(--text-secondary)' 
                }}>
                  {m.id}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {m.free && <span className="badge badge-success" style={{ fontSize: '9px' }}>FREE</span>}
                  {m.input?.includes('image') && <span title="Vision Support">🖼️</span>}
                  <span className="badge badge-default" style={{ fontSize: '9px' }}>{m.context}</span>
                </div>
              </div>
            ))}
          </div>
        ) : showModelBrowser && !loading ? (
          <div className="glass-card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-md)' }}>🔍</div>
            <p>No models found for this provider.</p>
          </div>
        ) : null}
      </div>

      {/* API Key */}
      {needsApiKey && (
        <div className="form-section">
          <h3 className="form-section-title">🔑 API Key</h3>
          {!state.apiKey && !state.skippedFields.includes('apiKey') ? (
            <div className="waiting-state">
              <div className="waiting-pulse">🔑</div>
              <h3 className="waiting-title">Waiting for API Key…</h3>
              <p className="waiting-desc">Get credentials from {currentProviderInfo?.name || state.provider}.</p>
              {currentProviderInfo?.consoleUrl && (
                <a href={currentProviderInfo.consoleUrl} target="_blank" rel="noopener noreferrer" className="waiting-link">
                  Open Console ↗
                </a>
              )}
              {providerDocsUrl && (
                <a href={providerDocsUrl} target="_blank" rel="noopener noreferrer" className="waiting-link">
                  Open Provider Docs ↗
                </a>
              )}
              <div style={{ width: '100%', maxWidth: '400px', marginTop: 'var(--space-md)' }}>
                <input
                  className="field-input mono"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your API key here…"
                  value={state.apiKey}
                  onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
                />
              </div>
              <span className="waiting-skip" onClick={() => dispatch({ type: 'SKIP_FIELD', payload: 'apiKey' })}>
                I'll do this later →
              </span>
            </div>
          ) : (
            <div className="field">
              <label className="field-label">API Key</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input
                  className="field-input mono"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your API key…"
                  value={state.apiKey}
                  onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => setShowKey(!showKey)}>
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>

              {currentProviderInfo?.consoleUrl && (
                <a href={currentProviderInfo.consoleUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
                  Get credentials ↗
                </a>
              )}
              {providerDocsUrl && (
                <a href={providerDocsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', marginLeft: '10px' }}>
                  Provider docs ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {usesOAuth && hasOAuthSupport && (
        <div className="form-section">
          <h3 className="form-section-title">🔓 OAuth Login</h3>
          {!authRunning && !authDone ? (
            <div className="waiting-state" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <div className="waiting-pulse" style={{ color: '#3b82f6' }}>🔐</div>
              <h3 className="waiting-title">Authentication Required</h3>
              <p className="waiting-desc">
                <strong>{currentAuthOption?.name}</strong> uses browser or device login through OpenClaw.
              </p>
              <button className="btn btn-primary btn-lg" onClick={handleStartAuth} type="button" style={{ marginTop: 'var(--space-md)' }}>
                Start OAuth Login
              </button>
              <span className="waiting-skip" onClick={() => dispatch({ type: 'SKIP_FIELD', payload: 'oauth' })} style={{ marginTop: 'var(--space-md)' }}>
                I&apos;ll do this later →
              </span>
            </div>
          ) : authDone && !authError ? (
            <div className="waiting-state" style={{ backgroundColor: 'rgba(52, 211, 153, 0.05)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
              <div className="waiting-pulse" style={{ color: '#34d399' }}>✅</div>
              <h3 className="waiting-title">Authenticated</h3>
              <p className="waiting-desc">
                <strong>{currentAuthOption?.name}</strong> completed successfully.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={resetAuthFlow} type="button" style={{ marginTop: 'var(--space-sm)' }}>
                Re-authenticate
              </button>
            </div>
          ) : (
            <div>
              {authUrl && (
                <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Open this URL to continue:</p>
                  <a href={authUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', wordBreak: 'break-all' }}>
                    {authUrl} ↗
                  </a>
                </div>
              )}

              <div
                ref={authLogRef}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  color: '#999',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {authLogs.map((log, index) => (
                  <div key={`${index}-${log}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log}</div>
                ))}
                {authRunning && <div className="animate-pulse" style={{ color: '#fb923c' }}>Waiting for authentication...</div>}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                {authRunning ? (
                  <button className="btn btn-ghost btn-sm" onClick={handleCancelAuth} type="button">Cancel</button>
                ) : (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={handleStartAuth} type="button">Retry OAuth</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'SKIP_FIELD', payload: 'oauth' })} type="button">Skip for now</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep} disabled={!canContinue}>
          Continue →
        </button>
      </div>
    </div>
  )
}
