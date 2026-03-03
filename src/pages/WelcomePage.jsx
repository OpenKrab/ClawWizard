import { useWizard } from '../context/WizardContext'
import { USE_CASES, TEMPLATES } from '../data/templates'

export default function WelcomePage() {
  const { state, dispatch, nextStep } = useWizard()

  const handleSelect = (useCase) => {
    dispatch({ type: 'SET_USE_CASE', payload: useCase.id })
  }

  const handleContinue = () => {
    if (state.selectedUseCase) nextStep()
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">
          Welcome to <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ClawWizard</span> 🦞
        </h1>
        <p className="page-subtitle">
          Set up your OpenClaw personal AI assistant in minutes. Choose your use case to get started with tailored recommendations.
        </p>
      </div>

      <div className="card-grid card-grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {USE_CASES.map((uc, i) => (
          <div
            key={uc.id}
            className={`glass-card clickable usecase-card animate-in animate-in-delay-${i + 1} ${state.selectedUseCase === uc.id ? 'selected' : ''}`}
            onClick={() => handleSelect(uc)}
          >
            <span className="usecase-icon">{uc.icon}</span>
            <h3 className="usecase-title">{uc.title}</h3>
            <p className="usecase-desc">{uc.desc}</p>
            <div className="usecase-meta">
              <span className={`badge ${uc.difficulty === 'beginner' ? 'badge-success' : uc.difficulty === 'intermediate' ? 'badge-warning' : uc.difficulty === 'advanced' ? 'badge-error' : 'badge-default'}`}>
                {uc.difficulty}
              </span>
              <span className="badge badge-default">Cost: {uc.cost}</span>
            </div>
          </div>
        ))}
      </div>

      {state.selectedUseCase && (
        <div className="animate-in" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            📦 Recommended Templates
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            One-click presets for your use case. You can customize everything in the next steps.
          </p>

          <div className="card-grid card-grid-2">
            {TEMPLATES
              .filter(t => t.useCases.includes(state.selectedUseCase))
              .map((template, i) => (
                <div
                  key={template.id}
                  className={`glass-card clickable template-card animate-in animate-in-delay-${i + 1} ${state.selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'APPLY_TEMPLATE', payload: template })}
                >
                  <div className="template-header">
                    <span className="template-icon">{template.icon}</span>
                    <div>
                      <h3 className="template-name">{template.name}</h3>
                      <p className="template-desc">{template.description}</p>
                    </div>
                  </div>
                  <div className="template-tags">
                    {template.tags.map(tag => (
                      <span key={tag} className="badge badge-accent">{tag}</span>
                    ))}
                  </div>
                  <div className="template-actions">
                    <span className={`badge ${template.difficulty === 'beginner' ? 'badge-success' : template.difficulty === 'intermediate' ? 'badge-warning' : 'badge-error'}`}>
                      {template.difficulty}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="nav-footer">
        <div />
        <button className="btn btn-primary btn-lg" onClick={handleContinue} disabled={!state.selectedUseCase}>
          Continue →
        </button>
      </div>

      {/* Quick Install Guide */}
      <div className="form-section" style={{ marginTop: 'var(--space-xxl)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-xl)' }}>
        <h3 className="form-section-title">📦 Don't have OpenClaw Core yet?</h3>
        <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
          Run the official installer to set up the OpenClaw engine on your machine.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>🍎 macOS / 🐧 Linux / 🦞 WSL2</h4>
            <code style={{ display: 'block', fontSize: '11px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', color: 'var(--text-accent)' }}>
              curl -fsSL https://openclaw.ai/install.sh | bash
            </code>
          </div>
          <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>🪟 Windows (PowerShell)</h4>
            <code style={{ display: 'block', fontSize: '11px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', color: 'var(--text-accent)' }}>
              iwr -useb https://openclaw.ai/install.ps1 | iex
            </code>
          </div>
        </div>
        <p className="field-hint" style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
          See <a href="https://docs.openclaw.ai/install" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)' }}>Official Install Docs</a> for more methods (Docker, Nix, Ansible).
        </p>
      </div>
    </div>
  )
}
