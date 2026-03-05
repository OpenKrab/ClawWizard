import { useState, useEffect, useMemo, useRef } from 'react'
import { useWizard } from '../context/WizardContext'
import { MODEL_PROVIDERS } from '../data/templates'

const PROVIDER_DOC_PATH_MAP = {
  anthropic: 'anthropic',
  'claude-max-proxy': 'anthropic',
  'amazon-bedrock': 'amazon-bedrock',
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

export default function ModelAuthPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [showKey, setShowKey] = useState(false)
  const [allModels, setAllModels] = useState([])
  const [dynamicProviders, setDynamicProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFree, setFilterFree] = useState(false)

  // OAuth interactive auth state
  const [authRunning, setAuthRunning] = useState(false)
  const [authLogs, setAuthLogs] = useState([])
  const [authDone, setAuthDone] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  const authLogRef = useRef(null)
  const eventSourceRef = useRef(null)

  // Fetch ALL models once on mount
  useEffect(() => {
    fetchAllModels()
  }, [])

  const fetchAllModels = async (refresh = false) => {
    setLoading(true)
    try {
      // WEB Bridge fetch
      const url = refresh ? '/api/models?refresh=1' : '/api/models'
      const res = await fetch(url)
      const data = await res.json()
      setAllModels(data.models || [])
      setDynamicProviders(data.providers || [])
    } catch {
      // Fallback: no models from CLI
      setAllModels([])
      setDynamicProviders([])
    } finally {
      setLoading(false)
    }
  }

  // Merge dynamic providers with hardcoded ones  
  const providerList = useMemo(() => {
    // Start with providers from CLI
    const seen = new Set()
    const merged = []

    // Dynamic providers first (sorted by most authed)
    for (const dp of dynamicProviders) {
      seen.add(dp.id)
      // Find matching hardcoded template for icon/name
      const tpl = MODEL_PROVIDERS.find(p => p.id === dp.id)
      merged.push({
        id: dp.id,
        name: tpl?.name || dp.id,
        icon: tpl?.icon || '🔌',
        count: dp.count,
        authed: dp.authed,
        freeCount: dp.freeCount,
        consoleUrl: tpl?.consoleUrl || '',
        keyPattern: tpl?.keyPattern || null,
        envKey: tpl?.envKey || '',
        authOptions: tpl?.authOptions || [],
        authChoice: tpl?.authChoice || '',
      })
    }

    // Add remaining hardcoded providers not in CLI
    for (const tpl of MODEL_PROVIDERS) {
      if (!seen.has(tpl.id)) {
        merged.push({
          id: tpl.id,
          name: tpl.name,
          icon: tpl.icon,
          count: tpl.models?.length || 0,
          authed: 0,
          freeCount: 0,
          consoleUrl: tpl.consoleUrl || '',
          keyPattern: tpl.keyPattern || null,
          envKey: tpl.envKey || '',
          authOptions: tpl.authOptions || [],
          authChoice: tpl.authChoice || '',
        })
      }
    }
    return merged
  }, [dynamicProviders])

  const currentProviderInfo = providerList.find(p => p.id === state.provider) || providerList[0]
  const currentAuthOption = currentProviderInfo?.authOptions?.find(o => o.id === (state.authChoice || currentProviderInfo?.authChoice)) || currentProviderInfo?.authOptions?.[0]
  const providerDocsPath = PROVIDER_DOC_PATH_MAP[state.provider]
  const providerDocsUrl = providerDocsPath ? `https://docs.openclaw.ai/providers/${providerDocsPath}` : ''

  const needsApiKey = state.provider !== 'ollama' && (!currentAuthOption || !currentAuthOption.isSubscription || currentAuthOption.isToken)
  const isSubscription = currentAuthOption?.isSubscription
  const isOAuth = currentAuthOption?.isOAuth
  const keyValid = !needsApiKey || !!state.apiKey || state.skippedFields.includes('apiKey')
  const modelSet = !!state.config.agents.defaults.model.primary

  // OAuth auth handlers
  const handleStartAuth = async () => {
    const choice = state.authChoice || currentProviderInfo?.authChoice
    if (!choice) return

    setAuthRunning(true)
    setAuthLogs([])
    setAuthDone(false)
    setAuthError(false)
    setAuthUrl('')

    try {
      const res = await fetch('/api/auth-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authChoice: choice }),
      })

      const reader = res.body.getReader()
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
            if (data.type === 'url') {
              setAuthUrl(data.url)
            } else if (data.type === 'done') {
              setAuthDone(data.success)
              setAuthError(!data.success)
              setAuthRunning(false)
            } else if (data.type === 'error') {
              setAuthError(true)
              setAuthRunning(false)
            }
            if (data.msg) {
              setAuthLogs(prev => [...prev.slice(-100), data.msg])
            }
          } catch {}
        }
      }
    } catch (err) {
      setAuthLogs(prev => [...prev, `❌ Connection error: ${err.message}`])
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
  const providerModels = useMemo(() => {
    let models = allModels.filter(m => m.provider === state.provider)
    // If CLI didn't return models for this provider, fallback to hardcoded
    if (models.length === 0) {
      const tpl = MODEL_PROVIDERS.find(p => p.id === state.provider)
      if (tpl?.models?.length) {
        models = tpl.models.map(id => ({
          id, provider: state.provider, input: 'text', context: '-',
          local: false, auth: false, tags: '', free: false,
        }))
      }
    }
    // Filter
    if (filterFree) models = models.filter(m => m.free)
    if (searchQuery) models = models.filter(m => m.id.toLowerCase().includes(searchQuery.toLowerCase()))
    return models
  }, [allModels, state.provider, filterFree, searchQuery])

  const freeCount = allModels.filter(m => m.provider === state.provider && m.free).length

  const handleProviderChange = (providerId) => {
    dispatch({ type: 'SET_PROVIDER', payload: providerId })
    const providerInfo = providerList.find(p => p.id === providerId)
    dispatch({ type: 'SET_AUTH_CHOICE', payload: providerInfo?.authChoice || '' })
    dispatch({ type: 'UNSKIP_FIELD', payload: 'apiKey' })
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
  }

  const canContinue = modelSet && (keyValid || isOAuth || (isSubscription && !currentAuthOption?.isToken) || state.skippedFields.includes('apiKey'))

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Model & Auth</h1>
        <p className="page-subtitle">
          Providers and models fetched live from OpenClaw CLI.
          {!loading && <span style={{ color: 'var(--text-tertiary)' }}> {allModels.length} models across {dynamicProviders.length} providers</span>}
        </p>
      </div>

      {/* Provider Selection */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>🏢 Provider</h3>
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
            <button className="btn btn-ghost btn-sm" onClick={() => fetchAllModels(true)} disabled={loading}>
              {loading ? <span className="animate-pulse">🔄</span> : '🔄'} Refresh
            </button>
          </div>
        </div>
        <div className="card-grid card-grid-3">
          {loading && dynamicProviders.length === 0 ? (
            // Skeleton Loading for Providers
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
                {provider.count > 0 && (
                  <span style={{ fontSize: '10px', color: provider.authed > 0 ? 'var(--status-success)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                    {provider.count} models {provider.authed > 0 && `(${provider.authed} ✓)`}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Model Selection */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>
            🤖 Model
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {freeCount > 0 && (
              <button className={`btn btn-sm ${filterFree ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterFree(!filterFree)}>
                🆓 Free ({freeCount})
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {(providerModels.length > 5 || loading) && (
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
        {loading && allModels.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: '40px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : providerModels.length > 0 ? (
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
        ) : !loading ? (
          <div className="glass-card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-md)' }}>🔍</div>
            <p>No models found for this provider.</p>
          </div>
        ) : null}

        {/* Custom input */}
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <input
            className="field-input mono"
            type="text"
            placeholder={`e.g. ${state.provider}/model-name`}
            value={state.config.agents.defaults.model.primary}
            onChange={(e) => handleModelSelect(e.target.value)}
            style={{ fontSize: '13px' }}
          />
          <p className="field-hint" style={{ marginTop: '4px' }}>
            Selected: <strong style={{ color: 'var(--text-accent)' }}>{state.config.agents.defaults.model.primary || 'none'}</strong>
          </p>
        </div>
      </div>

      {/* Auth Method Selection */}
      {currentProviderInfo?.authOptions?.length > 1 && (
        <div className="form-section">
          <h3 className="form-section-title">🔑 Authentication Method</h3>
          <div className="card-grid card-grid-2">
            {currentProviderInfo.authOptions.map(opt => {
              const isActive = state.authChoice === opt.id || (!state.authChoice && opt.id === currentProviderInfo.authChoice);
              return (
                <div 
                  key={opt.id}
                  className={`glass-card clickable animate-scale ${isActive ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'SET_AUTH_CHOICE', payload: opt.id })}
                  style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                >
                  <div style={{ fontSize: '24px' }}>{opt.icon || '🔑'}</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{opt.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{opt.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OAuth Interactive Authentication */}
      {isOAuth && (
        <div className="form-section">
          <h3 className="form-section-title">🔓 Browser Authentication</h3>
          {!authRunning && !authDone ? (
            <div className="waiting-state" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <div className="waiting-pulse" style={{ color: '#3b82f6' }}>🔐</div>
              <h3 className="waiting-title">Authentication Required</h3>
              <p className="waiting-desc">
                <strong>{currentAuthOption?.name}</strong> requires browser-based login.
                Click below to start the authentication flow.
              </p>
              <button className="btn btn-primary btn-lg" onClick={handleStartAuth} style={{ marginTop: 'var(--space-md)' }}>
                🚀 Authenticate Now
              </button>
              <span className="waiting-skip" onClick={() => dispatch({ type: 'SKIP_FIELD', payload: 'apiKey' })} style={{ marginTop: 'var(--space-md)' }}>
                I'll do this manually later →
              </span>
            </div>
          ) : authDone && !authError ? (
            <div className="waiting-state" style={{ backgroundColor: 'rgba(52, 211, 153, 0.05)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
              <div className="waiting-pulse" style={{ color: '#34d399' }}>✅</div>
              <h3 className="waiting-title">Authenticated!</h3>
              <p className="waiting-desc">
                <strong>{currentAuthOption?.name}</strong> authentication completed successfully.
                You're ready to continue.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthDone(false); setAuthLogs([]); }} style={{ marginTop: 'var(--space-sm)' }}>
                🔄 Re-authenticate
              </button>
            </div>
          ) : (
            <div>
              {/* Auth URL banner */}
              {authUrl && (
                <div className="glass-card" style={{ 
                  padding: 'var(--space-md)', marginBottom: 'var(--space-md)',
                  background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-md)'
                }}>
                  <span style={{ fontSize: '24px' }}>🌐</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Open this URL to authenticate:</p>
                    <a href={authUrl} target="_blank" rel="noopener noreferrer" 
                      style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', wordBreak: 'break-all' }}>
                      {authUrl} ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Terminal output */}
              <div ref={authLogRef} style={{
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
                maxHeight: '200px', overflowY: 'auto',
                fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '1.6',
                color: '#999', border: '1px solid var(--glass-border)',
              }}>
                {authLogs.map((log, i) => (
                  <div key={i} style={{
                    color: log.startsWith('✅') ? '#4ade80' :
                           log.startsWith('❌') ? '#f87171' :
                           log.startsWith('🚀') || log.startsWith('🔐') ? '#fb923c' :
                           log.startsWith('⚠') ? '#fbbf24' : '#999',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  }}>{log}</div>
                ))}
                {authRunning && <div className="animate-pulse" style={{ color: '#fb923c' }}>⏳ Waiting for authentication...</div>}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                {authRunning ? (
                  <button className="btn btn-ghost btn-sm" onClick={handleCancelAuth}>✖ Cancel</button>
                ) : (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={handleStartAuth}>🔄 Retry</button>
                    {authError && (
                      <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'SKIP_FIELD', payload: 'apiKey' })}>
                        Skip for now →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription / No Key Needed (non-OAuth) */}
      {!needsApiKey && isSubscription && !isOAuth && (
        <div className="form-section">
          <h3 className="form-section-title">🎫 Subscription Active</h3>
          <div className="waiting-state" style={{ backgroundColor: 'rgba(52, 211, 153, 0.05)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
            <div className="waiting-pulse" style={{ color: '#34d399' }}>✅</div>
            <h3 className="waiting-title">Ready to use Subscription</h3>
            <p className="waiting-desc">
              Your selected method <strong>({currentAuthOption?.name})</strong> does not require a manual API key. 
              The CLI will use your locally authenticated session.
            </p>
          </div>
        </div>
      )}

      {/* API Key */}
      {needsApiKey && (
        <div className="form-section">
          <h3 className="form-section-title">
            {currentAuthOption?.isToken || currentAuthOption?.isSubscription
              ? '🎫 Subscription / Token' 
              : '🔑 API Key'}
          </h3>
          {!state.apiKey && !state.skippedFields.includes('apiKey') ? (
            <div className="waiting-state">
              <div className="waiting-pulse">🔑</div>
              <h3 className="waiting-title">Waiting for {currentAuthOption?.isToken ? 'Token' : 'API Key'}…</h3>
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
                  placeholder={`Paste your ${currentAuthOption?.isToken ? 'token' : 'API key'} here…`}
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
              <label className="field-label">{currentAuthOption?.isToken ? 'Token' : 'API Key'}</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input
                  className="field-input mono"
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Paste your ${currentAuthOption?.isToken ? 'token' : 'API key'}…`}
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

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep} disabled={!canContinue}>
          Continue →
        </button>
      </div>
    </div>
  )
}
