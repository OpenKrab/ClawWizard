import { useWizard } from '../context/WizardContext'
import { TOOL_GROUPS } from '../data/templates'

export default function ToolsSkillsPage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const deniedTools = state.config.tools?.deny || []

  const isGroupDenied = (groupId) => deniedTools.includes(groupId)

  const toggleGroup = (groupId) => {
    const deny = deniedTools.includes(groupId)
      ? deniedTools.filter(t => t !== groupId)
      : [...deniedTools, groupId]
    dispatch({ type: 'UPDATE_CONFIG', payload: { tools: { deny } } })
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Tools & Skills</h1>
        <p className="page-subtitle">
          Enable or disable tool groups. Tools are what give your agent superpowers — browsing, code execution, file access, and more.
        </p>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">🛠️ Tool Groups</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          All tools are enabled by default. Toggle off groups you want to restrict.
        </p>

        <div className="card-grid card-grid-2">
          {TOOL_GROUPS.map((group, i) => {
            const disabled = isGroupDenied(group.id)
            return (
              <div
                key={group.id}
                className={`glass-card clickable animate-in animate-in-delay-${Math.min(i + 1, 7)}`}
                onClick={() => toggleGroup(group.id)}
                style={{
                  padding: 'var(--space-md)',
                  opacity: disabled ? 0.5 : 1,
                  border: disabled ? '1px solid var(--glass-border)' : '1px solid var(--status-success)',
                  transition: 'all var(--transition-base)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '24px' }}>{group.icon}</span>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{group.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{group.desc}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {group.tools.map(tool => (
                          <span key={tool} className="badge badge-default" style={{ fontSize: '10px' }}>{tool}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '18px',
                      color: disabled ? 'var(--status-error)' : 'var(--status-success)',
                    }}
                  >
                    {disabled ? '✗' : '✓'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Browser Config */}
      {!isGroupDenied('group:ui') && (
        <div className="form-section animate-in" style={{ marginTop: 'var(--space-xl)' }}>
          <h3 className="form-section-title">🌐 Browser Configuration</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
            Configure how the agent interacts with web pages.
          </p>

          <div className="form-grid form-grid-3">
            <div className="field">
              <label className="field-label">Default Profile</label>
              <select
                className="field-select"
                value={state.config.browser.defaultProfile}
                onChange={(e) => dispatch({ 
                  type: 'UPDATE_CONFIG', 
                  payload: { browser: { defaultProfile: e.target.value } } 
                })}
              >
                <option value="chrome">Chrome (Extension Relay)</option>
                <option value="openclaw">OpenClaw (Managed)</option>
              </select>
              <span className="field-hint">Extension relay uses your current browser.</span>
            </div>

            <div className="field">
              <label className="field-label">Headless Mode</label>
              <select
                className="field-select"
                value={state.config.browser.headless ? 'on' : 'off'}
                onChange={(e) => dispatch({ 
                  type: 'UPDATE_CONFIG', 
                  payload: { browser: { headless: e.target.value === 'on' } } 
                })}
              >
                <option value="off">Off (Visible - Recommended)</option>
                <option value="on">On (Hidden)</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">Private Network Access</label>
              <select
                className="field-select"
                value={state.config.browser.ssrfPolicy.dangerouslyAllowPrivateNetwork ? 'on' : 'off'}
                onChange={(e) => dispatch({ 
                  type: 'UPDATE_CONFIG', 
                  payload: { browser: { ssrfPolicy: { dangerouslyAllowPrivateNetwork: e.target.value === 'on' } } } 
                })}
              >
                <option value="on">Allow (Trusted Network)</option>
                <option value="off">Deny (Strict Public-only)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Skills info */}
      <div className="form-section" style={{ marginTop: 'var(--space-xl)' }}>
        <h3 className="form-section-title">🎯 Skills</h3>
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <span style={{ fontSize: '32px', marginBottom: 'var(--space-md)', display: 'block' }}>📦</span>
          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Skills will be configured after deployment</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            Skills are installed into <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>~/.openclaw/workspace/skills/</code>.
            You can install skills via CLI or ask your agent to install them during a conversation.
          </p>
          <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-accent">Web Search</span>
            <span className="badge badge-accent">Memory</span>
            <span className="badge badge-accent">Calendar</span>
            <span className="badge badge-accent">Email</span>
            <span className="badge badge-accent">GitHub</span>
            <span className="badge badge-accent">SQL</span>
          </div>
        </div>
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep}>Continue →</button>
      </div>
    </div>
  )
}
