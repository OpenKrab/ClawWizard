import { useWizard } from '../context/WizardContext'
import { PERSONALITY_PRESETS } from '../data/templates'

export default function WorkspacePage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()

  const handlePreset = (preset) => {
    dispatch({ type: 'SET_SOUL_MD', payload: preset.soul })
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Workspace & Personality</h1>
        <p className="page-subtitle">
          Configure where your agent lives and how it behaves. The <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>SOUL.md</code> defines your agent's personality and system prompt.
        </p>
      </div>

      {/* Workspace Path */}
      <div className="form-section">
        <h3 className="form-section-title">📁 Workspace Path</h3>
        <div className="field">
          <input
            className="field-input mono"
            type="text"
            value={state.config.agents.defaults.workspace}
            onChange={(e) => dispatch({
              type: 'UPDATE_CONFIG',
              payload: { agents: { defaults: { workspace: e.target.value } } },
            })}
          />
          <span className="field-hint">
            Agent files (AGENTS.md, SOUL.md, TOOLS.md, skills/) will be stored here
          </span>
        </div>
      </div>

      {/* Personality Presets */}
      <div className="form-section">
        <h3 className="form-section-title">🎭 Personality Preset</h3>
        <div className="card-grid card-grid-4">
          {PERSONALITY_PRESETS.map((preset, i) => (
            <div
              key={preset.id}
              className={`glass-card clickable animate-in animate-in-delay-${i + 1}`}
              onClick={() => handlePreset(preset)}
              style={{ padding: 'var(--space-md)', textAlign: 'center' }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{preset.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{preset.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SOUL.md Editor */}
      <div className="form-section">
        <h3 className="form-section-title">📝 SOUL.md — System Prompt</h3>
        <textarea
          className="code-editor"
          value={state.soulMd}
          onChange={(e) => dispatch({ type: 'SET_SOUL_MD', payload: e.target.value })}
          placeholder="Write your agent's personality and instructions here...

Example:
You are a helpful AI assistant. Be concise and friendly.
Always cite sources when providing information.
Use tools proactively to help the user."
          rows={12}
        />
        <span className="field-hint" style={{ marginTop: 'var(--space-xs)' }}>
          This will be saved as <code>~/.openclaw/workspace/SOUL.md</code> and injected into every conversation
        </span>
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep}>Continue →</button>
      </div>
    </div>
  )
}
