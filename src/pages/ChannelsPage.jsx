import { useState, useEffect } from 'react'
import { useWizard } from '../context/WizardContext'
import { MESSAGING_CHANNELS } from '../data/templates'

export default function ChannelsPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [expandedChannel, setExpandedChannel] = useState(null)
  const [pairingList, setPairingList] = useState([])
  const [loadingPairing, setLoadingPairing] = useState(false)
  const [approveCode, setApproveCode] = useState('')

  const channels = state.config.channels
  const channelIds = MESSAGING_CHANNELS.map(c => c.id)

  const fetchPairing = async (id) => {
    setLoadingPairing(true)
    try {
      const res = await fetch(`/api/pairing/list?channel=${id}`)
      const list = await res.json()
      setPairingList(list || [])
    } catch {
      setPairingList([])
    } finally {
      setLoadingPairing(false)
    }
  }

  const handleApprove = async (id, code) => {
    try {
      await fetch('/api/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: id, code })
      })
      fetchPairing(id)
      setApproveCode('')
    } catch (err) {
      alert(`Approval failed: ${err}`)
    }
  }

  useEffect(() => {
    if (expandedChannel) {
      fetchPairing(expandedChannel)
    }
  }, [expandedChannel])

  const toggleChannel = (id) => {
    dispatch({
      type: 'SET_CHANNEL',
      payload: { channel: id, data: { enabled: !channels[id]?.enabled } },
    })
  }

  const updateChannelField = (id, field, value) => {
    dispatch({
      type: 'SET_CHANNEL',
      payload: { channel: id, data: { [field]: value } },
    })
  }

  const enabledCount = channelIds.filter(id => channels[id]?.enabled).length

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Messaging Channels</h1>
        <p className="page-subtitle">
          Connect your AI to messaging platforms. Enable channels and configure their credentials.
          {enabledCount > 0 && (
            <span className="badge badge-success" style={{ marginLeft: '8px' }}>{enabledCount} active</span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {MESSAGING_CHANNELS.map((channel, i) => {
          const id = channel.id
          const ch = channels[id] || {}
          const isEnabled = ch.enabled
          const isExpanded = expandedChannel === id

          return (
            <div key={id} className={`animate-in animate-in-delay-${Math.min(i + 1, 7)}`}>
              {/* Channel Toggle Row */}
              <div
                className={`toggle-wrap ${isEnabled ? 'active' : ''}`}
                onClick={() => toggleChannel(id)}
                style={{ 
                  borderRadius: isExpanded && isEnabled ? 'var(--radius-md) var(--radius-md) 0 0' : undefined,
                  borderBottom: isExpanded && isEnabled ? 'none' : undefined
                }}
              >
                <div className="toggle-info">
                  <span className="toggle-icon">{channel.icon}</span>
                  <div>
                    <span className="toggle-label">{channel.name}</span>
                    <p className="toggle-desc">Connect via OpenClaw</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  {isEnabled && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedChannel(isExpanded ? null : id)
                      }}
                    >
                      {isExpanded ? '▲' : '⚙️ Setup'}
                    </button>
                  )}
                  <div className="toggle-switch" />
                </div>
              </div>

              {/* Expanded Config */}
              {isEnabled && isExpanded && (
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    borderTop: 'none',
                    animation: 'fadeIn 0.2s ease-out',
                    marginTop: '-1px'
                  }}
                >
                  <div className="form-grid" style={{ gap: 'var(--space-lg)' }}>
                    {/* Documentation Link */}
                    {channel.docsUrl && (
                      <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <a 
                          href={channel.docsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="waiting-link"
                          style={{ display: 'inline-block', margin: 0 }}
                        >
                          View Official {channel.name} Docs ↗
                        </a>
                      </div>
                    )}

                    {/* CLI Setup Instructions */}
                      <div className="field">
                        <label className="field-label">CLI Pairing Command</label>
                        <pre className="code-block" style={{ fontSize: '11px', padding: '12px' }}>
                          {channel.cliSetup}
                        </pre>
                        <p className="field-hint">Run these commands in your terminal to link the channel.</p>
                      </div>

                    {/* Live Pairing Requests */}
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="field-label">Pending Pairing Requests</label>
                        <button className="btn btn-ghost btn-sm" onClick={() => fetchPairing(id)}>🔄 Refresh</button>
                      </div>
                      <div className="glass-card" style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.02)' }}>
                        {loadingPairing ? (
                          <p className="field-hint">Loading...</p>
                        ) : (pairingList || []).length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pairingList.map(p => (
                              <div key={p.account + p.peer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px' }}>{p.peer} ({p.account})</span>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApprove(id, p.code)}>Approve</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="field-hint">No pending requests found.</p>
                        )}
                      </div>
                    </div>

                    {/* Manual Input (e.g. Bot Token) */}
                    {channel.envKey && (
                      <div className="field">
                        <label className="field-label">{channel.name} API Key / Token</label>
                        <input
                          className="field-input mono"
                          type="password"
                          placeholder={`${channel.envKey}...`}
                          value={ch.botToken || ''}
                          onChange={(e) => updateChannelField(id, 'botToken', e.target.value)}
                        />
                        <p className="field-hint">Stored in .env as {channel.envKey}</p>
                      </div>
                    )}

                    {/* Standard Policies */}
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', gridColumn: '1 / -1' }}>
                      <div className="field">
                        <label className="field-label">DM Policy</label>
                        <select
                          className="field-select"
                          value={ch.dmPolicy || 'pairing'}
                          onChange={(e) => updateChannelField(id, 'dmPolicy', e.target.value)}
                        >
                          <option value="pairing">Pairing (default)</option>
                          <option value="allowlist">Allowlist</option>
                          <option value="open">Open</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>

                      <div className="field">
                        <label className="field-label">Group Policy</label>
                        <select
                          className="field-select"
                          value={ch.groupPolicy || 'allowlist'}
                          onChange={(e) => updateChannelField(id, 'groupPolicy', e.target.value)}
                        >
                          <option value="allowlist">Allowlist (default)</option>
                          <option value="open">Open</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep}>Continue →</button>
      </div>
    </div>
  )
}
