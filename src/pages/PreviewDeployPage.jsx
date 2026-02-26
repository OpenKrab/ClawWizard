import { useState, useEffect, useRef } from 'react'
import { useWizard } from '../context/WizardContext'

export default function PreviewDeployPage() {
  const { state, generateConfig, prevStep } = useWizard()
  const [copied, setCopied] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [logs, setLogs] = useState([])
  const [deployStatus, setDeployStatus] = useState(null)
  const logEndRef = useRef(null)

  const config = generateConfig()
  const configJson = JSON.stringify(config, null, 2)

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  // Validation warnings
  const warnings = []
  if (!state.config.agents.defaults.model.primary) warnings.push('No model selected')
  if (!state.apiKey && !state.skippedFields.includes('apiKey') && state.provider !== 'ollama') warnings.push('No API key provided')
  const enabledChannels = Object.entries(state.config.channels).filter(([, v]) => v.enabled)
  if (enabledChannels.length === 0) warnings.push('No channels enabled')
  if (state.skippedFields.length > 0) warnings.push(`${state.skippedFields.length} field(s) skipped — fill them before deploying`)

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
    setLogs(['🚀 Starting deployment...', '📁 Validating config...', '📝 Writing openclaw.json and .env to ~/.openclaw/'])
    setDeployStatus('running')

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: config,
          env: state.config.env, // Should be merging apiKey if not skipped
          soulMd: state.soulMd
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setLogs(prev => [...prev, `✅ ${result.message}`])
        setDeployStatus('success')
        
        // Start streaming logs
        const eventSource = new EventSource('/api/logs')
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          setLogs(prev => [...prev.slice(-100), data.msg])
        }
        eventSource.onerror = () => eventSource.close()
      } else {
        setLogs(prev => [...prev, `❌ Error: ${result.error || 'Failed to deploy'}`])
        setDeployStatus('error')
      }
    } catch (e) {
      setLogs(prev => [...prev, `❌ Error connecting to bridge: ${e.message}`, '💡 Make sure "npm run dev" is running with the bridge active.'])
      setDeployStatus('error')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Preview & Deploy</h1>
        <p className="page-subtitle">
          Review your configuration, then deploy. The generated config goes to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>~/.openclaw/openclaw.json</code>.
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
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
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}>
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: logs.length > 0 ? '1fr 1fr' : '1fr', gap: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Config Summary */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 className="form-section-title" style={{ margin: 0 }}>📄 openclaw.json</h3>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                  💾 Download
                </button>
              </div>
            </div>
            <pre className="code-editor" style={{ minHeight: '300px', maxHeight: '500px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {configJson}
            </pre>
          </div>

          {/* SOUL.md Preview */}
          {state.soulMd && (
            <div className="form-section">
              <h3 className="form-section-title">🎭 SOUL.md</h3>
              <pre className="code-editor" style={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                {state.soulMd}
              </pre>
            </div>
          )}
        </div>

        {/* Live Terminal Logs */}
        {logs.length > 0 && (
          <div className="form-section animate-in">
            <h3 className="form-section-title">🛰️ Deployment Logs</h3>
            <div 
              style={{ 
                background: '#000', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--space-md)', 
                height: '500px', 
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '1.5',
                color: '#ddd',
                border: '1px solid var(--border-color)',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
              }}
            >
              {logs.map((log, i) => (
                <div key={i} style={{ 
                  color: log.startsWith('✅') ? 'var(--status-success)' : 
                         log.startsWith('❌') ? 'var(--status-error)' : 
                         log.startsWith('🚀') ? 'var(--text-accent)' : '#ddd',
                  marginBottom: '2px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Deploy Section */}
      <div className="form-section" style={{ marginTop: 'var(--space-xl)' }}>
        <h3 className="form-section-title">🚀 Deploy</h3>

        <div className="card-grid card-grid-2">
          {/* Remote Option */}
          <div className={`glass-card ${!showDeploy ? 'active' : ''}`} style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: 'var(--space-md)', display: 'block' }}>💻</span>
            <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Deploy Local Machine</h4>
            <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
              Automatically write configs and start OpenClaw daemon on this machine.
            </p>
            <button 
              className={`btn btn-primary btn-lg ${deploying ? 'loading' : ''}`} 
              disabled={deploying || warnings.length > 0}
              onClick={handleLiveDeploy}
            >
              {deploying ? 'Deploying...' : 'Deploy Now 🚀'}
            </button>
          </div>

          {/* Manual Option */}
          <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: 'var(--space-md)', display: 'block' }}>📋</span>
            <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Manual Instructions</h4>
            <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
              Get step-by-step commands to deploy OpenClaw on any server.
            </p>
            <button className="btn btn-secondary btn-lg" onClick={() => setShowDeploy(!showDeploy)}>
              {showDeploy ? 'Hide Instructions' : 'Show Instructions'}
            </button>
          </div>
        </div>

        {showDeploy && (
          <div className="glass-card animate-in" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📋 Deployment Steps</h4>

            {[
              { step: 1, title: 'Install OpenClaw', cmd: 'npm install -g openclaw@latest', desc: 'Requires Node.js 22+' },
              { step: 2, title: 'Save config file', cmd: 'Download the config above and save to ~/.openclaw/openclaw.json', desc: 'Or use the Download button' },
              { step: 3, title: 'Save SOUL.md', cmd: state.soulMd ? 'Save SOUL.md to ~/.openclaw/workspace/SOUL.md' : '(Optional) No custom personality set', desc: 'If you wrote a custom system prompt' },
              { step: 4, title: 'Install daemon & start', cmd: 'openclaw onboard --install-daemon', desc: 'Installs background service and starts gateway' },
              { step: 5, title: 'Verify', cmd: 'openclaw doctor', desc: 'Check that everything is running correctly' },
              { step: 6, title: 'Open dashboard', cmd: 'openclaw dashboard', desc: 'Opens the web control UI in your browser' },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  display: 'flex',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-lg)',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--accent-gradient)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {item.step}
                </span>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{item.title}</h5>
                  <code style={{
                    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '13px',
                    background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-accent)', marginBottom: '4px',
                  }}>
                    {item.cmd}
                  </code>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-secondary" onClick={handleDownload}>💾 Download Config</button>
      </div>
    </div>
  )
}
