import { useState } from 'react'
import { useWizard } from '../context/WizardContext'
import { MODEL_PROVIDERS } from '../data/templates'

export default function ModelAuthPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [showKey, setShowKey] = useState(false)

  const currentProvider = MODEL_PROVIDERS.find(p => p.id === state.provider) || MODEL_PROVIDERS[0]
  const needsApiKey = currentProvider.id !== 'ollama'
  const keyValid = !needsApiKey || !currentProvider.keyPattern || currentProvider.keyPattern.test(state.apiKey) || state.skippedFields.includes('apiKey')
  const modelSet = !!state.config.agents.defaults.model.primary

  const handleProviderChange = (providerId) => {
    dispatch({ type: 'SET_PROVIDER', payload: providerId })
    const provider = MODEL_PROVIDERS.find(p => p.id === providerId)
    if (provider && provider.models.length > 0) {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: { agents: { defaults: { model: { primary: provider.models[0] } } } },
      })
    }
  }

  const handleModelChange = (model) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { agents: { defaults: { model: { primary: model } } } },
    })
  }

  const canContinue = modelSet && (keyValid || state.skippedFields.includes('apiKey'))

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Model & Auth</h1>
        <p className="page-subtitle">
          Choose your AI model provider and set up authentication. OpenClaw uses the <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>provider/model</code> format.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="form-section">
        <h3 className="form-section-title">🏢 Provider</h3>
        <div className="card-grid card-grid-3">
          {MODEL_PROVIDERS.map((provider, i) => (
            <div
              key={provider.id}
              className={`glass-card clickable animate-in animate-in-delay-${i + 1} ${state.provider === provider.id ? 'selected' : ''}`}
              onClick={() => handleProviderChange(provider.id)}
              style={{ padding: 'var(--space-md)', textAlign: 'center' }}
            >
              <span style={{ fontSize: '24px' }}>{provider.icon}</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>{provider.name}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>🤖 Model</h3>
          <span className="field-hint" style={{ fontSize: '12px' }}>Format: provider/model</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <select
            className="field-select"
            value={currentProvider.models.includes(state.config.agents.defaults.model.primary) ? state.config.agents.defaults.model.primary : 'custom'}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                // Prefill with provider/ to help user get the format right
                handleModelChange(currentProvider.id + '/')
              } else if (e.target.value === '') {
                handleModelChange('')
              } else {
                handleModelChange(e.target.value)
              }
            }}
          >
            <option value="">Select a model…</option>
            {currentProvider.models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="custom">✎ Enter custom model string…</option>
          </select>

          {(!currentProvider.models.includes(state.config.agents.defaults.model.primary) || !state.config.agents.defaults.model.primary || state.config.agents.defaults.model.primary.endsWith('/')) && (
            <div className="field animate-in">
              <input
                className="field-input mono"
                type="text"
                placeholder={`e.g. ${currentProvider.id}/custom-model-name`}
                value={state.config.agents.defaults.model.primary}
                onChange={(e) => handleModelChange(e.target.value)}
                autoFocus
              />
              <p className="field-hint">
                <span style={{ color: 'var(--status-warning)' }}>💡 Tip:</span> OpenClaw works best with the <code>provider/model</code> format.
              </p>
            </div>
          )}
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
              <p className="waiting-desc">
                You'll need an API key from {currentProvider.name}. {currentProvider.id === 'anthropic' ? 'Sign up, add billing, and create a key.' : 'Sign up and create an API key.'}
              </p>
              {currentProvider.consoleUrl && (
                <a
                  href={currentProvider.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="waiting-link"
                >
                  Open {currentProvider.name} Console ↗
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
              {state.apiKey && !keyValid && (
                <span className="field-error">API key format doesn't match {currentProvider.name} pattern</span>
              )}
              {state.apiKey && keyValid && (
                <span className="field-hint" style={{ color: 'var(--status-success)' }}>✓ API key format looks valid</span>
              )}
              {state.skippedFields.includes('apiKey') && !state.apiKey && (
                <span className="field-hint" style={{ color: 'var(--status-warning)' }}>⚠ Skipped — you'll need to add this before deploying</span>
              )}
              {currentProvider.consoleUrl && (
                <a href={currentProvider.consoleUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
                  Get API key from {currentProvider.name} ↗
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
