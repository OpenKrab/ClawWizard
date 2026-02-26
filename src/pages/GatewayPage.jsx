import { useWizard } from '../context/WizardContext'

export default function GatewayPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const gw = state.config.gateway

  const update = (data) => dispatch({ type: 'SET_GATEWAY', payload: data })

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Gateway Configuration</h1>
        <p className="page-subtitle">
          The Gateway is the local control plane that manages all connections. It runs as a WebSocket server at <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>ws://127.0.0.1:18789</code>.
        </p>
      </div>

      <div className="form-grid form-grid-2">
        {/* Port */}
        <div className="field">
          <label className="field-label">Port</label>
          <input
            className="field-input mono"
            type="number"
            value={gw.port}
            onChange={(e) => update({ port: parseInt(e.target.value) || 18789 })}
          />
          <span className="field-hint">Default: 18789</span>
        </div>

        {/* Bind Address */}
        <div className="field">
          <label className="field-label">Bind Address</label>
          <select
            className="field-select"
            value={gw.bind}
            onChange={(e) => update({ bind: e.target.value })}
          >
            <option value="127.0.0.1">127.0.0.1 (localhost only)</option>
            <option value="0.0.0.0">0.0.0.0 (all interfaces)</option>
          </select>
          <span className="field-hint">Use localhost for security. Use 0.0.0.0 only for remote access.</span>
        </div>
      </div>

      {/* Auth */}
      <div className="form-section" style={{ marginTop: 'var(--space-xl)' }}>
        <h3 className="form-section-title">🔐 Authentication</h3>
        <div className="form-grid form-grid-2">
          <div className="field">
            <label className="field-label">Auth Mode</label>
            <select
              className="field-select"
              value={gw.auth.mode}
              onChange={(e) => update({ auth: { ...gw.auth, mode: e.target.value } })}
            >
              <option value="token">Token (auto-generated)</option>
              <option value="password">Password</option>
              <option value="none">None (not recommended)</option>
            </select>
          </div>

          {gw.auth.mode === 'token' && (
            <div className="field">
              <label className="field-label">Token</label>
              <input
                className="field-input mono"
                type="text"
                placeholder="Leave empty for auto-generation"
                value={gw.auth.token}
                onChange={(e) => update({ auth: { ...gw.auth, token: e.target.value } })}
              />
              <span className="field-hint">Auto-generated on first start if empty</span>
            </div>
          )}

          {gw.auth.mode === 'password' && (
            <div className="field">
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                placeholder="Set gateway password"
                value={gw.auth.password || ''}
                onChange={(e) => update({ auth: { ...gw.auth, password: e.target.value } })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tailscale */}
      <div className="form-section" style={{ marginTop: 'var(--space-xl)' }}>
        <h3 className="form-section-title">🔗 Tailscale Exposure</h3>
        <div className="card-grid card-grid-3">
          {[
            { mode: 'off', title: 'Off', desc: 'No Tailscale (default)', icon: '🚫' },
            { mode: 'serve', title: 'Serve', desc: 'Tailnet-only HTTPS', icon: '🔒' },
            { mode: 'funnel', title: 'Funnel', desc: 'Public HTTPS (requires password)', icon: '🌍' },
          ].map((opt) => (
            <div
              key={opt.mode}
              className={`glass-card clickable ${gw.tailscale.mode === opt.mode ? 'selected' : ''}`}
              onClick={() => update({ tailscale: { mode: opt.mode } })}
              style={{ padding: 'var(--space-md)', textAlign: 'center' }}
            >
              <span style={{ fontSize: '24px' }}>{opt.icon}</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px' }}>{opt.title}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{opt.desc}</p>
            </div>
          ))}
        </div>

        {gw.tailscale.mode === 'funnel' && gw.auth.mode !== 'password' && (
          <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <span style={{ color: 'var(--status-warning)', fontWeight: 600, fontSize: '14px' }}>
              ⚠️ Funnel requires password auth mode. Please change auth mode above.
            </span>
          </div>
        )}
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep}>Continue →</button>
      </div>
    </div>
  )
}
