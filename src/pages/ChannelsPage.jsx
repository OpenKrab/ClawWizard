import { useState, useEffect } from 'react'
import { useWizard } from '../context/WizardContext'
import { MESSAGING_CHANNELS } from '../data/templates'

const CHANNEL_CONFIG_DOCS = [
  { id: 'pairing', label: 'Pairing', url: 'https://docs.openclaw.ai/channels/pairing' },
  { id: 'groups', label: 'Groups', url: 'https://docs.openclaw.ai/channels/groups' },
  { id: 'routing', label: 'Channel Routing', url: 'https://docs.openclaw.ai/channels/channel-routing' },
  { id: 'troubleshooting', label: 'Troubleshooting', url: 'https://docs.openclaw.ai/channels/troubleshooting' },
]

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

  const updateNestedChannelField = (id, key, value) => {
    updateChannelField(id, key, value)
  }

  const getCliSetupCommand = (channel, channelConfig) => {
    if (channel.id !== 'bluebubbles') return channel.cliSetup

    const httpUrl = channelConfig.httpUrl || 'http://192.168.1.100:1234'
    const password = channelConfig.password || 'YOUR_BLUEBUBBLES_PASSWORD'
    const webhookPath = channelConfig.webhookPath || '/bluebubbles-webhook'

    return `openclaw channels add bluebubbles --http-url "${httpUrl}" --password "${password}" --webhook-path "${webhookPath}"\nopenclaw channels login bluebubbles`
  }

  const getCredentialField = (channel) => {
    if (channel.credentialField) return channel.credentialField
    if (channel.id === 'discord') return 'token'
    return 'botToken'
  }

  const parseCsv = (value) => {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  }

  const formatCsv = (value) => {
    if (!Array.isArray(value) || value.length === 0) return ''
    return value.join(', ')
  }

  const supportsGroupControls = (channelId) => {
    return channelId !== 'webchat'
  }

  const getRequireMention = (channelConfig) => {
    if (channelConfig?.groups?.['*']?.requireMention === false) return false
    return true
  }

  const setRequireMention = (channelId, channelConfig, requireMention) => {
    const groups = { ...(channelConfig.groups || {}) }
    groups['*'] = {
      ...(groups['*'] || {}),
      requireMention,
    }
    updateNestedChannelField(channelId, 'groups', groups)
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {CHANNEL_CONFIG_DOCS.map(doc => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="waiting-link"
              style={{ margin: 0 }}
            >
              {doc.label} Docs ↗
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {MESSAGING_CHANNELS.map((channel, i) => {
          const id = channel.id
          const ch = channels[id] || {}
          const isEnabled = ch.enabled
          const isExpanded = expandedChannel === id
          const credentialField = getCredentialField(channel)

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
                          {getCliSetupCommand(channel, ch)}
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
                          value={ch[credentialField] || ''}
                          onChange={(e) => updateChannelField(id, credentialField, e.target.value)}
                        />
                        <p className="field-hint">Stored in .env as {channel.envKey}</p>
                      </div>
                    )}

                    {id === 'bluebubbles' && (
                      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', gridColumn: '1 / -1' }}>
                        <div className="field">
                          <label className="field-label">BlueBubbles HTTP URL</label>
                          <input
                            className="field-input mono"
                            type="text"
                            placeholder="http://192.168.1.100:1234"
                            value={ch.httpUrl || ''}
                            onChange={(e) => updateChannelField(id, 'httpUrl', e.target.value)}
                          />
                          <p className="field-hint">URL to your BlueBubbles server.</p>
                        </div>

                        <div className="field">
                          <label className="field-label">BlueBubbles Password</label>
                          <input
                            className="field-input mono"
                            type="password"
                            placeholder="Server password"
                            value={ch.password || ''}
                            onChange={(e) => updateChannelField(id, 'password', e.target.value)}
                          />
                          <p className="field-hint">Password configured in BlueBubbles Server.</p>
                        </div>

                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                          <label className="field-label">Webhook Path</label>
                          <input
                            className="field-input mono"
                            type="text"
                            placeholder="/bluebubbles-webhook"
                            value={ch.webhookPath || '/bluebubbles-webhook'}
                            onChange={(e) => updateChannelField(id, 'webhookPath', e.target.value)}
                          />
                          <p className="field-hint">Must match your OpenClaw webhook endpoint route.</p>
                        </div>
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
                        <p className="field-hint">For `open`, include `*` in DM allowlist.</p>
                      </div>

                      {supportsGroupControls(id) && (
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
                      )}
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', gridColumn: '1 / -1' }}>
                      <div className="field">
                        <label className="field-label">DM Allowlist</label>
                        <input
                          className="field-input mono"
                          type="text"
                          placeholder="user-id-1, user-id-2, *"
                          value={formatCsv(ch.allowFrom)}
                          onChange={(e) => updateChannelField(id, 'allowFrom', parseCsv(e.target.value))}
                        />
                        <p className="field-hint">Used when `dmPolicy` is `allowlist` or `open`.</p>
                      </div>

                      {supportsGroupControls(id) && (
                        <div className="field">
                          <label className="field-label">Group Allowlist</label>
                          <input
                            className="field-input mono"
                            type="text"
                            placeholder="user-id-1, user-id-2"
                            value={formatCsv(ch.groupAllowFrom)}
                            onChange={(e) => updateChannelField(id, 'groupAllowFrom', parseCsv(e.target.value))}
                          />
                          <p className="field-hint">Optional sender allowlist for groups.</p>
                        </div>
                      )}
                    </div>

                    {supportsGroupControls(id) && (
                      <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label className="field-label">Group Activation</label>
                        <div className="toggle-wrap active" style={{ padding: '12px 14px' }}>
                          <div className="toggle-info">
                            <span className="toggle-icon">🎯</span>
                            <div>
                              <span className="toggle-label">Require Mention in Groups</span>
                              <p className="toggle-desc">When enabled, group messages are processed only on mention.</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={getRequireMention(ch)}
                            onChange={(e) => setRequireMention(id, ch, e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label className="field-label">Troubleshooting Commands</label>
                      <pre className="code-block" style={{ fontSize: '11px', padding: '12px' }}>
{`openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe`}
                      </pre>
                      <p className="field-hint">Run in order when a channel is connected but not responding.</p>
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
