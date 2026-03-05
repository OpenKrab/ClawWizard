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
  const [showRemoteForm, setShowRemoteForm] = useState(false)
  const [remoteConfig, setRemoteConfig] = useState({
    host: '',
    port: 22,
    username: 'root',
    password: '',
    privateKey: ''
  })
  const [pairingList, setPairingList] = useState([])
  const [loadingPairing, setLoadingPairing] = useState(false)
  const [approveCode, setApproveCode] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testMessage, setTestMessage] = useState('Hello! This is a test message to generate pairing code.')
  const logEndRef = useRef(null)
  const eventSourceRef = useRef(null)

  const config = generateConfig()
  const configJson = JSON.stringify(config, null, 2)

  const currentProvider = MODEL_PROVIDERS.find(p => p.id === state.provider)
  const enabledChannels = MESSAGING_CHANNELS.filter(c => state.config.channels[c.id]?.enabled)

  const getChannelManualCommand = (channelId, fallbackCommand) => {
    if (channelId === 'bluebubbles') {
      const bluebubbles = state.config.channels.bluebubbles || {}
      const httpUrl = bluebubbles.httpUrl || 'http://192.168.1.100:1234'
      const password = bluebubbles.password || 'YOUR_BLUEBUBBLES_PASSWORD'
      const webhookPath = bluebubbles.webhookPath || '/bluebubbles-webhook'
      return `openclaw channels add bluebubbles --http-url "${httpUrl}" --password "${password}" --webhook-path "${webhookPath}"\nopenclaw channels login bluebubbles`
    }

    if (channelId === 'discord') {
      const discord = state.config.channels.discord || {}
      const token = discord.token || '$DISCORD_BOT_TOKEN'
      return `openclaw config set channels.discord.token "\\"${token}\\"" --json\nopenclaw config set channels.discord.enabled true --json\nopenclaw gateway`
    }

    return fallbackCommand
  }

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

  // Pairing functions
  const fetchPairing = async (channelId) => {
    setLoadingPairing(true)
    try {
      const res = await fetch(`/api/pairing/list?channel=${channelId}`)
      const list = await res.json()
      setPairingList(list || [])
    } catch {
      setPairingList([])
    } finally {
      setLoadingPairing(false)
    }
  }

  const handleApprove = async (channel, code) => {
    try {
      await fetch('/api/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, code })
      })
      fetchPairing(channel)
      setApproveCode('')
    } catch (err) {
      alert(`Approval failed: ${err}`)
    }
  }

  const handleSendTest = async (channel) => {
    if (!channel) return
    
    setSendingTest(true)
    try {
      const response = await fetch('/api/pairing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, message: testMessage })
      })
      const result = await response.json()
      
      if (result.success) {
        // Auto-refresh pairing list after sending test message
        setTimeout(() => {
          fetchPairing(channel)
        }, 2000) // Wait 2 seconds for pairing code to be generated
      } else {
        alert(`Failed to send test message: ${result.message}`)
      }
    } catch (err) {
      alert(`Failed to send test message: ${err}`)
    } finally {
      setSendingTest(false)
    }
  }

  // Validation warnings
  const warnings = []
  if (!state.config.agents.defaults.model.primary) warnings.push('No model selected')
  
  const currentProviderInfo = MODEL_PROVIDERS.find(p => p.id === state.provider)
  const currentAuthOption = currentProviderInfo?.authOptions?.find(o => o.id === (state.authChoice || currentProviderInfo?.authChoice)) || currentProviderInfo?.authOptions?.[0]
  const needsApiKey = state.provider !== 'ollama' && (!currentAuthOption || !currentAuthOption.isSubscription || currentAuthOption.isToken)
  
  if (needsApiKey && !state.apiKey && !state.skippedFields.includes('apiKey')) {
    warnings.push('No API key provided')
  }
  
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
      // --- WEB BRIDGE DEPLOY ---
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          env: state.config.env || {},
          workspaceFiles: state.workspaceFiles || {},
          provider: state.provider || '',
          apiKey: state.apiKey || '',
          authChoice: state.authChoice || '',
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
        `❌ Deployment failed: ${e.message}`,
        '💡 Make sure npm run dev is running',
      ])
      setDeployStatus('error')
    } finally {
      setDeploying(false)
    }
  }

  const handleRemoteDeploy = async () => {
    if (!remoteConfig.host || !remoteConfig.username) {
      alert('SSH Host and Username are required.')
      return
    }

    setDeploying(true)
    setShowLogs(true)
    setShowRemoteForm(false)
    setLogs([
      '🚀 Starting Remote SSH Deployment...',
      `🔗 Connecting to ${remoteConfig.username}@${remoteConfig.host}:${remoteConfig.port}...`,
    ])
    setDeployStatus('running')

    try {
      // --- WEB BRIDGE SSH DEPLOY ---
      const response = await fetch('/api/deploy-remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sshConfig: remoteConfig,
          config,
          env: state.config.env || {},
          workspaceFiles: state.workspaceFiles || {},
          provider: state.provider || '',
          apiKey: state.apiKey || '',
        })
      })

      const result = await response.json()
      if (result.steps) {
        setLogs(prev => [...prev, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ...result.steps])
      }

      if (result.success) {
        setDeployStatus('success')
        setLogs(prev => [...prev, '', '🎉 Remote deployment complete! Gateway is running on VPS.'])
      } else {
        setLogs(prev => [...prev, `❌ Error: ${result.error || 'Failed to deploy remotely'}`])
        setDeployStatus('error')
      }
    } catch (e) {
      setLogs(prev => [...prev, `❌ Connection error: ${e.message}`])
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
  enabledChannels.forEach(chan => manualSteps.push({
    title: `Pair ${chan.name}`,
    cmd: getChannelManualCommand(chan.id, chan.cliSetup),
    desc: `Connect to ${chan.name}.`
  }))
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
        <div className="animate-scale" style={{
          padding: 'var(--space-xl)',
          background: statusBanner[deployStatus].bg,
          border: `1px solid ${statusBanner[deployStatus].border}`,
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle glow */}
          <div style={{ 
            position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', 
            background: statusBanner[deployStatus].color, opacity: 0.1, filter: 'blur(60px)', borderRadius: '50%' 
          }} />
          
          <span style={{ fontSize: '48px', position: 'relative' }}>{statusBanner[deployStatus].icon}</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: statusBanner[deployStatus].color, marginBottom: '6px', letterSpacing: '-0.01em' }}>
              {statusBanner[deployStatus].title}
            </h3>
            {deployStatus === 'success' && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Your OpenClaw agent is live and connected. Gateway is accepting connections on port <strong style={{color: 'var(--text-primary)'}}>{state.config.gateway?.port || 18789}</strong>.
              </p>
            )}
            {deployStatus === 'error' && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Check the logs below for details. You can also try the manual deployment steps.
              </p>
            )}
            {deployStatus === 'running' && (
              <div style={{ marginTop: '12px', height: '4px', background: 'rgba(255,107,53,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
          </div>
          {deployStatus === 'success' && (
            <div style={{ textAlign: 'right' }}>
               <span className="badge badge-success" style={{ fontSize: '12px', padding: '6px 14px', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>● ONLINE</span>
            </div>
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

      {/* ──── Pairing Management (after successful deploy) ──── */}
      {deployStatus === 'success' && enabledChannels.length > 0 && (
        <div className="form-section animate-in" style={{ marginTop: 'var(--space-xl)' }}>
          <h3 className="form-section-title">🔐 Approve First DM</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
            When someone sends your first DM, they'll receive a pairing code. You can also send a test message to generate a code immediately.
          </p>
          
          <div className="form-grid form-grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="field">
              <label className="field-label">Select Channel</label>
              <select
                className="field-select"
                value={selectedChannel}
                onChange={(e) => {
                  setSelectedChannel(e.target.value)
                  if (e.target.value) {
                    fetchPairing(e.target.value)
                  }
                }}
              >
                <option value="">Choose a channel...</option>
                {enabledChannels.map(chan => (
                  <option key={chan.id} value={chan.id}>{chan.name}</option>
                ))}
              </select>
            </div>
            
            <div className="field">
              <label className="field-label">Approval Code</label>
              <input
                className="field-input mono"
                type="text"
                placeholder="Enter 8-char code"
                value={approveCode}
                onChange={(e) => setApproveCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
          </div>

          {/* Test Message Section */}
          {selectedChannel && (
            <div className="glass-card" style={{ 
              padding: 'var(--space-lg)', 
              marginBottom: 'var(--space-lg)',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--text-accent)' }}>
                📤 Send Test Message
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Test Message</label>
                  <input
                    className="field-input"
                    type="text"
                    placeholder="Enter test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-accent"
                  onClick={() => handleSendTest(selectedChannel)}
                  disabled={sendingTest || !testMessage.trim()}
                >
                  {sendingTest ? '⏳ Sending...' : '📤 Send Test'}
                </button>
              </div>
              <p className="field-hint" style={{ marginTop: 'var(--space-sm)', marginBottom: 0 }}>
                This will send a test message to generate a pairing code instantly.
              </p>
            </div>
          )}

          {selectedChannel && (
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Pending Requests {loadingPairing && '(Loading...)'}
                </span>
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => fetchPairing(selectedChannel)}
                  disabled={loadingPairing}
                >
                  🔄 Refresh
                </button>
              </div>
              
              {pairingList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {pairingList.map((item, i) => (
                    <div key={i} className="glass-card" style={{
                      padding: 'var(--space-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,107,53,0.05)',
                      border: '1px solid rgba(255,107,53,0.2)'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.sender || 'Unknown Sender'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          Code: {item.code}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {item.timestamp && new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApprove(selectedChannel, item.code)}
                      >
                        ✓ Approve
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: 'var(--space-lg)',
                  textAlign: 'center',
                  background: 'var(--glass-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--glass-border)'
                }}>
                  <span style={{ fontSize: '24px', marginBottom: 'var(--space-sm)', display: 'block' }}>📭</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    No pending requests. Send a test message above or DM your bot directly.
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedChannel && approveCode && (
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleApprove(selectedChannel, approveCode)}
                disabled={approveCode.length !== 8}
              >
                ✅ Approve Code: {approveCode}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setApproveCode('')}
              >
                Clear
              </button>
            </div>
          )}
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

          <div className="glass-card" style={{ 
            padding: 'var(--space-xl)', 
            textAlign: 'center',
            border: '1px solid var(--text-accent)',
            background: 'rgba(255, 107, 53, 0.05)',
            boxShadow: '0 8px 32px rgba(255, 107, 53, 0.1)'
          }}>
            <span style={{ fontSize: '32px', marginBottom: 'var(--space-md)', display: 'block' }}>🛰️</span>
            <h4 style={{ fontWeight: 800, color: 'var(--text-accent)', marginBottom: 'var(--space-sm)' }}>Cloud / VPS Deployment</h4>
            <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
              Setup and run OpenClaw on a remote Linux server via SSH. Total automation.
            </p>
            <button 
              className="btn btn-accent btn-lg" 
              onClick={() => setShowRemoteForm(!showRemoteForm)} 
              style={{ width: '100%', fontWeight: 800 }}
              disabled={deploying}
            >
              {showRemoteForm ? 'Close Setup' : 'Remote SSH Setup 🛰️'}
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

        {/* ──── SSH Configuration Form ──── */}
        {showRemoteForm && (
          <div className="glass-card animate-in" style={{ 
            marginTop: 'var(--space-lg)', 
            padding: 'var(--space-xl)',
            border: '2px solid var(--text-accent)',
            background: 'var(--bg-secondary)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-accent)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                🛰️ Remote Host Settings
              </h4>
              <span className="badge badge-accent">ROOT ACCESS RECOMMENDED</span>
            </div>
            
            <div className="card-grid card-grid-2" style={{ gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="field-label" style={{ color: 'var(--text-secondary)' }}>Host IP Address</label>
                <input 
                  type="text" 
                  className="field-input mono" 
                  placeholder="123.123.123.123"
                  value={remoteConfig.host}
                  onChange={e => setRemoteConfig({...remoteConfig, host: e.target.value})}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>
              <div className="form-group">
                <label className="field-label" style={{ color: 'var(--text-secondary)' }}>SSH Port</label>
                <input 
                  type="number" 
                  className="field-input mono" 
                  placeholder="22"
                  value={remoteConfig.port}
                  onChange={e => setRemoteConfig({...remoteConfig, port: parseInt(e.target.value)})}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>
              <div className="form-group">
                <label className="field-label" style={{ color: 'var(--text-secondary)' }}>Login Username</label>
                <input 
                  type="text" 
                  className="field-input mono" 
                  placeholder="root"
                  value={remoteConfig.username}
                  onChange={e => setRemoteConfig({...remoteConfig, username: e.target.value})}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>
              <div className="form-group">
                <label className="field-label" style={{ color: 'var(--text-secondary)' }}>Password / Auth Key</label>
                <input 
                  type="password" 
                  className="field-input mono" 
                  placeholder="••••••••"
                  value={remoteConfig.password}
                  onChange={e => setRemoteConfig({...remoteConfig, password: e.target.value})}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)' }}>
              <button 
                className="btn btn-primary btn-lg" 
                onClick={handleRemoteDeploy} 
                style={{ flex: 2, fontSize: '16px', height: '56px' }}
                disabled={deploying}
              >
                {deploying ? '⏳ Deploying...' : '🚀 Execute Remote Deployment'}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => setShowRemoteForm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <p className="field-hint" style={{ margin: 0, fontSize: '12px' }}>
                💡 <strong>What happens next?</strong> ClawWizard will connect to your server, install Node.js (if missing), fetch OpenClaw Core, apply your configurations, and start the gateway service as a background process.
              </p>
            </div>
          </div>
        )}
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
