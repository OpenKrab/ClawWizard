import { useState, useEffect, useRef } from 'react'
import { useWizard } from '../context/WizardContext'
import { MODEL_PROVIDERS, MESSAGING_CHANNELS } from '../data/templates'

export default function PreviewDeployPage() {
  const { state, generateConfig, prevStep } = useWizard()
  const [copied, setCopied] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [logs, setLogs] = useState([])
  const [deployStatus, setDeployStatus] = useState(null) // null | 'running' | 'success' | 'warning' | 'error'
  const [showLogs, setShowLogs] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const logEndRef = useRef(null)
  const eventSourceRef = useRef(null)

  const config = generateConfig()
  const configJson = JSON.stringify(config, null, 2)

  const currentProvider = MODEL_PROVIDERS.find(p => p.id === state.provider)
  const enabledChannels = MESSAGING_CHANNELS.filter(c => state.config.channels[c.id]?.enabled)

  useEffect(() => {
    if (logEndRef.current && showLogs) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, showLogs])

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close()
    }
  }, [])

  // Validation warnings
  const warnings = []
  if (!state.config.agents.defaults.model.primary) warnings.push('No model selected')
  if (!state.apiKey && !state.skippedFields.includes('apiKey') && state.provider !== 'ollama') warnings.push('No API key provided')
  if (enabledChannels.length === 0) warnings.push('No channels enabled')

  const handleCopy = () => {
    navigator.clipboard.writeText(configJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'openclaw.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLiveDeploy = async () => {
    setDeploying(true)
    setShowLogs(true)
    setLogs([
      '🦞 ClawWizard Deploy Starting...',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📁 Writing openclaw.json...',
      '🔑 Writing .env credentials...',
      '🎭 Writing SOUL.md...',
    ])
    setDeployStatus('running')

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          env: state.config.env || {},
          soulMd: state.soulMd || '',
          workspaceFiles: state.workspaceFiles || {},
          provider: state.provider || '',
          apiKey: state.apiKey || '',
          gatewayPort: state.config.gateway?.port || 18789,
          gatewayBind: state.config.gateway?.bind || 'loopback',
          useNonInteractive: true,
        })
      })

      const result = await response.json()

      if (result.steps) {
        setLogs(prev => [...prev, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ...result.steps])
      }
      
      if (result.success) {
        setDeployStatus(result.needsManual ? 'warning' : 'success')
        setLogs(prev => [...prev, '', result.needsManual
          ? '⚠️ Config written. Install OpenClaw CLI then run: openclaw onboard'
          : '🎉 Deployment complete!'
        ])
        
        // Stream live logs (keep last 50 only)
        if (!result.needsManual) {
          try {
            const es = new EventSource('/api/logs')
            eventSourceRef.current = es
            es.onmessage = (event) => {
              const data = JSON.parse(event.data)
              setLogs(prev => [...prev.slice(-50), data.msg])
            }
            es.onerror = () => es.close()
          } catch { /* ignore */ }
        }
      } else {
        setLogs(prev => [...prev, `❌ Error: ${result.error || 'Failed to deploy'}`])
        setDeployStatus('error')
      }
    } catch (e) {
      setLogs(prev => [
        ...prev,
        `❌ Bridge server unreachable: ${e.message}`,
        '💡 Make sure npm run dev is running',
      ])
      setDeployStatus('error')
    } finally {
      setDeploying(false)
    }
  }

  const manualSteps = [
    { title: 'Install OpenClaw CLI', cmd: 'npm install -g openclaw@latest', desc: 'Node.js 22+ required.' },
    { title: 'Provider Setup', cmd: currentProvider?.cliSetup || 'openclaw onboard', desc: `Authenticate with ${currentProvider?.name || 'provider'}.` },
    { title: 'Security & Access', cmd: state.config.gateway.tailscale?.mode !== 'off' ? `openclaw configure --tailscale ${state.config.gateway.tailscale.mode}` : 'openclaw gateway status', desc: 'Verify gateway security.' },
  ]
  enabledChannels.forEach(chan => manualSteps.push({ title: `Pair ${chan.name}`, cmd: chan.cliSetup, desc: `Connect to ${chan.name}.` }))
  manualSteps.push({ title: 'Health Check', cmd: 'openclaw doctor', desc: 'Verify everything works.' })

  // ──────── Status Dashboard (shown after deploy) ────────
  const statusBanner = {
    success: { icon: '🎉', title: 'Gateway is Running!', color: 'var(--status-success)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)' },
    warning: { icon: '⚠️', title: 'Config Written — Manual Steps Needed', color: 'var(--status-warning)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
    error:   { icon: '❌', title: 'Deployment Failed', color: 'var(--status-error)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
    running: { icon: '⏳', title: 'Deploying...', color: 'var(--text-accent)', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.3)' },
  }

  const statusCards = [
    { icon: '🌐', label: 'Gateway', value: `ws://127.0.0.1:${state.config.gateway?.port || 18789}`, status: deployStatus === 'success' },
    { icon: '🤖', label: 'Model', value: state.config.agents.defaults.model.primary || 'Not set', status: !!state.config.agents.defaults.model.primary },
    { icon: '💬', label: 'Channels', value: enabledChannels.length > 0 ? enabledChannels.map(c => c.name).join(', ') : 'None', status: enabledChannels.length > 0 },
    { icon: '🔐', label: 'Auth', value: state.config.gateway?.auth?.mode || 'token', status: true },
    { icon: '🔗', label: 'Tailscale', value: state.config.gateway?.tailscale?.mode || 'off', status: state.config.gateway?.tailscale?.mode !== 'off' },
    { icon: '📁', label: 'Workspace', value: state.config.agents.defaults.workspace, status: true },
  ]

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Preview & Deploy</h1>
        <p className="page-subtitle">
          Review your configuration, then deploy to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>~/.openclaw/openclaw.json</code>
        </p>
      </div>

      {/* ──── Deploy Status Banner ──── */}
      {deployStatus && (
        <div className="animate-in" style={{
          padding: 'var(--space-lg)',
          background: statusBanner[deployStatus].bg,
          border: `1px solid ${statusBanner[deployStatus].border}`,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
        }}>
          <span style={{ fontSize: '40px' }}>{statusBanner[deployStatus].icon}</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: statusBanner[deployStatus].color, marginBottom: '4px' }}>
              {statusBanner[deployStatus].title}
            </h3>
            {deployStatus === 'success' && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Your OpenClaw agent is live and connected. Gateway is accepting connections on port {state.config.gateway?.port || 18789}.
              </p>
            )}
            {deployStatus === 'error' && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Check the logs below for details. You can also try the manual deployment steps.
              </p>
            )}
          </div>
          {deployStatus === 'success' && (
            <span className="badge badge-success" style={{ fontSize: '12px', padding: '6px 14px' }}>● ONLINE</span>
          )}
        </div>
      )}

      {/* ──── Warnings ──── */}
      {warnings.length > 0 && !deployStatus && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          {warnings.map((w, i) => (
            <div key={i} style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xs)',
              fontSize: '13px',
              color: 'var(--status-warning)',
            }}>
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {/* ──── Status Cards (after deploy) ──── */}
      {deployStatus && deployStatus !== 'running' && (
        <div className="card-grid card-grid-3 animate-in" style={{ marginBottom: 'var(--space-xl)' }}>
          {statusCards.map((card, i) => (
            <div key={i} className="glass-card" style={{
              padding: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              borderColor: card.status ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)',
            }}>
              <span style={{ fontSize: '22px' }}>{card.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {card.value}
                </div>
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: card.status ? 'var(--status-success)' : 'var(--text-tertiary)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* ──── Deploy Actions ──── */}
      <div className="form-section">
        <h3 className="form-section-title">🚀 Deploy</h3>
        <div className="card-grid card-grid-2">
          <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: 'var(--space-md)', display: 'block' }}>💻</span>
            <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Deploy Local Machine</h4>
            <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
              Write configs and start OpenClaw gateway on this machine.
            </p>
            <button 
              className={`btn btn-primary btn-lg`}
              disabled={deploying || (warnings.length > 0 && !deployStatus)}
              onClick={handleLiveDeploy}
              style={{ width: '100%' }}
            >
              {deploying ? '⏳ Deploying...' : deployStatus === 'success' ? '🔄 Re-deploy' : 'Deploy Now 🚀'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: 'var(--space-md)', display: 'block' }}>📋</span>
            <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Manual Instructions</h4>
            <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
              CLI commands based on your selected provider and channels.
            </p>
            <button className="btn btn-secondary btn-lg" onClick={() => setShowManual(!showManual)} style={{ width: '100%' }}>
              {showManual ? 'Hide Instructions' : 'Show Instructions'}
            </button>
          </div>
        </div>
      </div>

      {/* ──── Manual Steps ──── */}
      {showManual && (
        <div className="glass-card animate-in" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📋 CLI Deployment Steps</h4>
          {manualSteps.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{item.title}</h5>
                <pre style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-accent)', marginBottom: '2px', whiteSpace: 'pre-wrap' }}>
                  {item.cmd}
                </pre>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──── Config Preview (collapsible) ──── */}
      <div className="form-section" style={{ marginTop: 'var(--space-xl)' }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowConfig(!showConfig)}
        >
          <h3 className="form-section-title" style={{ margin: 0 }}>📄 openclaw.json</h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleCopy() }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDownload() }}>
              💾 Download
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
              {showConfig ? '▼' : '▶'}
            </span>
          </div>
        </div>
        {showConfig && (
          <pre className="code-editor animate-in" style={{ marginTop: 'var(--space-md)', maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {configJson}
          </pre>
        )}
      </div>

      {/* ──── Deployment Logs (collapsible) ──── */}
      {logs.length > 0 && (
        <div className="form-section" style={{ marginTop: 'var(--space-lg)' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowLogs(!showLogs)}
          >
            <h3 className="form-section-title" style={{ margin: 0 }}>
              🛰️ Deployment Logs
              {deployStatus === 'success' && <span style={{ fontSize: '10px', marginLeft: '8px', color: 'var(--status-success)' }}>● LIVE</span>}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
              {showLogs ? '▼ Hide' : '▶ Show'} ({logs.length} lines)
            </span>
          </div>
          {showLogs && (
            <div 
              className="animate-in"
              style={{ 
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--space-md)', 
                maxHeight: '250px', 
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: '1.5',
                color: '#aaa',
                border: '1px solid var(--glass-border)',
                marginTop: 'var(--space-md)',
              }}
            >
              {logs.map((log, i) => (
                <div key={i} style={{ 
                  color: log.startsWith('✅') ? '#4ade80' : 
                         log.startsWith('❌') ? '#f87171' : 
                         log.startsWith('🚀') || log.startsWith('🎉') ? '#fb923c' :
                         log.startsWith('⚠️') ? '#fbbf24' :
                         log.startsWith('━') ? '#444' : '#999',
                  marginBottom: '1px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      )}

      {/* ──── SOUL.md (collapsible) ──── */}
      {state.soulMd && (
        <details style={{ marginTop: 'var(--space-lg)' }}>
          <summary style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', padding: 'var(--space-sm) 0' }}>
            🎭 SOUL.md Preview
          </summary>
          <pre className="code-editor" style={{ marginTop: 'var(--space-sm)', maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {state.soulMd}
          </pre>
        </details>
      )}

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-secondary" onClick={handleDownload}>💾 Download Config</button>
      </div>
    </div>
  )
}
