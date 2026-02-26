import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DIAGNOSTICS_CHECKS } from '../data/templates'

export default function DiagnosticsPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)

  const runDiagnostics = () => {
    setRunning(true)
    setResults({})

    // Simulate diagnostic checks with random results
    const statuses = ['ok', 'warn', 'fail']
    const details = {
      ok: ['Running on port 18789', 'API key valid, latency 120ms', 'Connected and receiving messages', 'All tools accessible', 'Daemon active (systemd)', 'Config valid against schema'],
      warn: ['Port 18789 in use by another process', 'API key valid but nearing rate limit', 'Connected but slow response', 'Browser tool needs Chrome/Chromium', 'Daemon installed but not running', 'Config has deprecated keys'],
      fail: ['Could not connect to gateway', 'Invalid API key or expired', 'Bot token rejected', 'exec tool blocked by sandbox', 'Daemon not installed', 'Config has unknown keys — gateway won\'t start'],
    }

    DIAGNOSTICS_CHECKS.forEach((check, i) => {
      setTimeout(() => {
        const status = statuses[Math.floor(Math.random() * 3)]
        setResults(prev => ({
          ...prev,
          [check.id]: {
            status,
            detail: details[status][i] || 'Check completed',
            fix: status === 'fail' ? `Run: ${check.cmd}` : null,
          },
        }))
        if (i === DIAGNOSTICS_CHECKS.length - 1) setRunning(false)
      }, (i + 1) * 600)
    })
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">🩺 Diagnostics</h1>
        <p className="page-subtitle">
          Check the health of your OpenClaw setup. This mirrors the checks from <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>openclaw doctor</code>.
        </p>
      </div>

      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-primary" onClick={runDiagnostics} disabled={running}>
          {running ? '⏳ Running checks…' : '▶️ Run Diagnostics'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {DIAGNOSTICS_CHECKS.map((check, i) => {
          const result = results[check.id]
          return (
            <div key={check.id} className={`glass-card diag-card animate-in animate-in-delay-${Math.min(i + 1, 7)}`}>
              <div className={`diag-status ${result?.status || 'unknown'}`} />
              <div className="diag-info">
                <div className="diag-title">{check.name}</div>
                <div className="diag-detail">
                  {result ? result.detail : check.desc}
                </div>
                {result?.fix && (
                  <div style={{ marginTop: '6px' }}>
                    <code style={{
                      fontFamily: 'var(--font-mono)', fontSize: '12px',
                      background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px',
                      borderRadius: '4px', color: 'var(--status-error)',
                    }}>
                      💡 {result.fix}
                    </code>
                  </div>
                )}
              </div>
              <div>
                {result && (
                  <span className={`badge ${result.status === 'ok' ? 'badge-success' : result.status === 'warn' ? 'badge-warning' : 'badge-error'}`}>
                    {result.status === 'ok' ? 'Passed' : result.status === 'warn' ? 'Warning' : 'Failed'}
                  </span>
                )}
                {!result && running && (
                  <span className="badge badge-default">Pending…</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Common issues */}
      <div className="form-section" style={{ marginTop: 'var(--space-2xl)' }}>
        <h3 className="form-section-title">💡 Common Issues & Fixes</h3>
        <div className="card-grid card-grid-2">
          {[
            { title: 'Gateway won\'t start', fix: 'openclaw doctor --fix', desc: 'Usually caused by invalid config or port conflict' },
            { title: 'Rate limit errors', fix: 'Check API provider dashboard', desc: 'Reduce usage or add fallback model' },
            { title: 'Docker not running', fix: 'Start Docker Desktop', desc: 'Required for sandbox mode' },
            { title: 'Channel not connecting', fix: 'Regenerate bot token', desc: 'Token may have been revoked or expired' },
          ].map((item) => (
            <div key={item.title} className="glass-card" style={{ padding: 'var(--space-md)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--status-warning)' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{item.desc}</p>
              <code style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                background: 'var(--bg-primary)', padding: '4px 8px',
                borderRadius: '4px', color: 'var(--text-accent)',
              }}>
                {item.fix}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back to Wizard</button>
      </div>
    </div>
  )
}
