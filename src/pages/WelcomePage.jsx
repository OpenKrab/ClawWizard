import { useWizard } from '../context/WizardContext'
import { USE_CASES, TEMPLATES } from '../data/templates'
import { useTranslation } from '../i18n'

export default function WelcomePage() {
  const { state, dispatch, nextStep } = useWizard()
  const { t } = useTranslation()

  const handleSelect = (useCase) => {
    dispatch({ type: 'SET_USE_CASE', payload: useCase.id })
  }

  const handleContinue = () => {
    if (state.selectedUseCase) nextStep()
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto var(--space-3xl)' }}>
        <h1 className="page-title" style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>
          {t('welcome_title')} <br/>
          <span style={{ 
            background: 'linear-gradient(90deg, #ff6b35, #ff2d78, #6366f1)',
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% auto',
            animation: 'shimmer 3s linear infinite'
          }}>
            ClawWizard
          </span> 🦞
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.2rem', margin: '0 auto' }}>
          {t('welcome_subtitle')}
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
            <h3 className="usecase-title">{t(`uc_${uc.id}_title`) || uc.title}</h3>
            <p className="usecase-desc">{t(`uc_${uc.id}_desc`) || uc.desc}</p>
            <div className="usecase-meta">
              <span className={`badge ${uc.difficulty === 'beginner' ? 'badge-success' : uc.difficulty === 'intermediate' ? 'badge-warning' : uc.difficulty === 'advanced' ? 'badge-error' : 'badge-default'}`}>
                {uc.difficulty}
              </span>
              <span className="badge badge-default">{t('cost')} {t(`cost_${uc.cost.toLowerCase()}`) || uc.cost}</span>
            </div>
          </div>
        ))}
      </div>

      {state.selectedUseCase && (
        <div className="animate-in" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            {t('recommended_templates')}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {t('one_click_presets')}
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
          {t('btn_continue')}
        </button>
      </div>
    </div>
  )
}
