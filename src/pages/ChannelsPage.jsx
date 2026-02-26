import { useState } from 'react'
import { useWizard } from '../context/WizardContext'
import { CHANNEL_META } from '../data/templates'

export default function ChannelsPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [expandedChannel, setExpandedChannel] = useState(null)

  const channels = state.config.channels
  const channelIds = Object.keys(CHANNEL_META)

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
        <h1 className="page-title">Channels</h1>
        <p className="page-subtitle">
          Connect your AI to messaging platforms. Enable channels and configure their tokens.
          {enabledCount > 0 && (
            <span className="badge badge-success" style={{ marginLeft: '8px' }}>{enabledCount} active</span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {channelIds.map((id, i) => {
          const meta = CHANNEL_META[id]
          const ch = channels[id] || {}
          const isEnabled = ch.enabled
          const isExpanded = expandedChannel === id

          return (
            <div key={id} className={`animate-in animate-in-delay-${Math.min(i + 1, 7)}`}>
              {/* Channel Toggle Row */}
              <div
                className={`toggle-wrap ${isEnabled ? 'active' : ''}`}
                onClick={() => toggleChannel(id)}
                style={{ borderRadius: isExpanded && isEnabled ? 'var(--radius-md) var(--radius-md) 0 0' : undefined }}
              >
                <div className="toggle-info">
                  <span className="toggle-icon">{meta.icon}</span>
                  <div>
                    <span className="toggle-label">{meta.name}</span>
                    <p className="toggle-desc">{meta.desc}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  {isEnabled && meta.fields.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedChannel(isExpanded ? null : id)
                      }}
                    >
                      {isExpanded ? '▲' : '⚙️ Configure'}
                    </button>
                  )}
                  <div className="toggle-switch" />
                </div>
              </div>

              {/* Expanded Config */}
              {isEnabled && isExpanded && meta.fields.length > 0 && (
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    borderTop: 'none',
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                >
                  {/* Waiting state for tokens */}
                  {meta.fields.includes('botToken') && !ch.botToken && !state.skippedFields.includes(`${id}.botToken`) && (
                    <div className="waiting-state" style={{ marginBottom: 'var(--space-lg)' }}>
                      <div className="waiting-pulse">🔑</div>
                      <h3 className="waiting-title">Waiting for {meta.name} Bot Token…</h3>
                      <p className="waiting-desc">{meta.guide}</p>
                      {meta.guideUrl && (
                        <a href={meta.guideUrl} target="_blank" rel="noopener noreferrer" className="waiting-link">
                          Open {meta.name} Setup ↗
                        </a>
                      )}
                    </div>
                  )}

                  <div className="form-grid" style={{ gap: 'var(--space-md)' }}>
                    {meta.fields.includes('botToken') && (
                      <div className="field">
                        <label className="field-label">Bot Token</label>
                        <input
                          className="field-input mono"
                          type="password"
                          placeholder="Paste your bot token…"
                          value={ch.botToken || ''}
                          onChange={(e) => updateChannelField(id, 'botToken', e.target.value)}
                        />
                        {!ch.botToken && (
                          <span
                            className="waiting-skip"
                            style={{ fontSize: '12px', marginTop: '4px' }}
                            onClick={() => dispatch({ type: 'SKIP_FIELD', payload: `${id}.botToken` })}
                          >
                            I'll do this later →
                          </span>
                        )}
                      </div>
                    )}

                    {meta.fields.includes('applicationId') && (
                      <div className="field">
                        <label className="field-label">Application ID</label>
                        <input
                          className="field-input mono"
                          type="text"
                          placeholder="Discord Application ID"
                          value={ch.applicationId || ''}
                          onChange={(e) => updateChannelField(id, 'applicationId', e.target.value)}
                        />
                      </div>
                    )}

                    {meta.fields.includes('appToken') && (
                      <div className="field">
                        <label className="field-label">App Token</label>
                        <input
                          className="field-input mono"
                          type="password"
                          placeholder="Slack App-Level Token (xapp-…)"
                          value={ch.appToken || ''}
                          onChange={(e) => updateChannelField(id, 'appToken', e.target.value)}
                        />
                      </div>
                    )}

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

                    {meta.fields.includes('allowFrom') && (
                      <div className="field">
                        <label className="field-label">Allow From</label>
                        <input
                          className="field-input mono"
                          type="text"
                          placeholder={id === 'whatsapp' ? '+1234567890' : 'user_id or *'}
                          value={(ch.allowFrom || []).join(', ')}
                          onChange={(e) => updateChannelField(id, 'allowFrom', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        />
                        <span className="field-hint">Comma-separated. Use * for all.</span>
                      </div>
                    )}

                    {meta.fields.includes('url') && (
                      <div className="field">
                        <label className="field-label">Server URL</label>
                        <input
                          className="field-input mono"
                          type="text"
                          placeholder="https://mattermost.example.com"
                          value={ch.url || ''}
                          onChange={(e) => updateChannelField(id, 'url', e.target.value)}
                        />
                      </div>
                    )}

                    {meta.fields.includes('token') && (
                      <div className="field">
                        <label className="field-label">Token</label>
                        <input
                          className="field-input mono"
                          type="password"
                          placeholder="Access token"
                          value={ch.token || ''}
                          onChange={(e) => updateChannelField(id, 'token', e.target.value)}
                        />
                      </div>
                    )}
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
