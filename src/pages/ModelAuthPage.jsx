import { useState, useEffect, useMemo } from 'react'
import { useWizard } from '../context/WizardContext'
import { MODEL_PROVIDERS } from '../data/templates'

export default function ModelAuthPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [showKey, setShowKey] = useState(false)
  const [allModels, setAllModels] = useState([])
  const [dynamicProviders, setDynamicProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFree, setFilterFree] = useState(false)

  // Fetch ALL models once on mount
  useEffect(() => {
    fetchAllModels()
  }, [])

  const fetchAllModels = async (refresh = false) => {
    setLoading(true)
    try {
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
        })
      }
    }
    return merged
  }, [dynamicProviders])

  const currentProviderInfo = providerList.find(p => p.id === state.provider) || providerList[0]
  const needsApiKey = state.provider !== 'ollama'
  const keyValid = !needsApiKey || !currentProviderInfo?.keyPattern || currentProviderInfo.keyPattern.test(state.apiKey) || state.skippedFields.includes('apiKey')
  const modelSet = !!state.config.agents.defaults.model.primary

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

  const canContinue = modelSet && (keyValid || state.skippedFields.includes('apiKey'))

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>🏢 Provider</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchAllModels(true)} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        <div className="card-grid card-grid-3">
          {providerList.map((provider) => (
            <div
              key={provider.id}
              className={`glass-card clickable ${state.provider === provider.id ? 'selected' : ''}`}
              onClick={() => handleProviderChange(provider.id)}
              style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', position: 'relative' }}
            >
              <span style={{ fontSize: '20px' }}>{provider.icon}</span>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{provider.name}</h4>
              {provider.count > 0 && (
                <span style={{ fontSize: '10px', color: provider.authed > 0 ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                  {provider.count} models {provider.authed > 0 && `(${provider.authed} ✓)`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>
            🤖 Model
            {loading && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>⏳</span>}
          </h3>
          {freeCount > 0 && (
            <button className={`btn btn-sm ${filterFree ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterFree(!filterFree)}>
              🆓 Free ({freeCount})
            </button>
          )}
        </div>

        {/* Search */}
        {providerModels.length > 5 && (
          <input
            className="field-input"
            type="text"
            placeholder="🔍 Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 'var(--space-sm)', fontSize: '13px' }}
          />
        )}

        {/* Model List */}
        {providerModels.length > 0 ? (
          <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            {providerModels.map(m => (
              <div
                key={m.id}
                onClick={() => handleModelSelect(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                  padding: '8px 12px', cursor: 'pointer',
                  background: state.config.agents.defaults.model.primary === m.id ? 'rgba(255,107,53,0.12)' : 'transparent',
                  borderBottom: '1px solid var(--glass-border)',
                  opacity: m.auth ? 1 : 0.5,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (state.config.agents.defaults.model.primary !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { if (state.config.agents.defaults.model.primary !== m.id) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                  border: state.config.agents.defaults.model.primary === m.id ? 'none' : '2px solid var(--glass-border)',
                  background: state.config.agents.defaults.model.primary === m.id ? 'var(--accent-primary)' : 'transparent',
                }} />
                <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: state.config.agents.defaults.model.primary === m.id ? 'var(--text-accent)' : 'var(--text-primary)' }}>
                  {m.id}
                </span>
                <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                  {m.free && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 700 }}>FREE</span>}
                  {m.input?.includes('image') && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>🖼️</span>}
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'var(--glass-bg)', color: 'var(--text-tertiary)' }}>{m.context}</span>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            No models found. Try selecting a different provider or use custom input below.
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

      {/* API Key */}
      {needsApiKey && (
        <div className="form-section">
          <h3 className="form-section-title">🔑 API Key</h3>
          {!state.apiKey && !state.skippedFields.includes('apiKey') ? (
            <div className="waiting-state">
              <div className="waiting-pulse">🔑</div>
              <h3 className="waiting-title">Waiting for API Key…</h3>
              <p className="waiting-desc">Get an API key from {currentProviderInfo?.name || state.provider}.</p>
              {currentProviderInfo?.consoleUrl && (
                <a href={currentProviderInfo.consoleUrl} target="_blank" rel="noopener noreferrer" className="waiting-link">
                  Open Console ↗
                </a>
              )}
              <div style={{ width: '100%', maxWidth: '400px', marginTop: 'var(--space-md)' }}>
                <input
                  className={`field-input mono ${state.apiKey ? (keyValid ? 'success' : 'error') : ''}`}
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
                  className={`field-input mono ${state.apiKey ? (keyValid ? 'success' : 'error') : ''}`}
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
              {state.apiKey && keyValid && (
                <span className="field-hint" style={{ color: 'var(--status-success)' }}>✓ API key looks valid</span>
              )}
              {currentProviderInfo?.consoleUrl && (
                <a href={currentProviderInfo.consoleUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
                  Get API key ↗
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
