import { useWizard } from '../context/WizardContext'

export default function LanguageSwitcher() {
  const { state, dispatch } = useWizard()

  const toggleLang = () => {
    const newLang = state.lang === 'en' ? 'th' : 'en'
    dispatch({ type: 'SET_LANG', payload: newLang })
  }

  return (
    <button
      onClick={toggleLang}
      className="btn btn-ghost btn-sm"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        borderRadius: 'var(--radius-sm)',
        marginRight: '8px'
      }}
      title="Switch Language / เปลี่ยนภาษา"
    >
      <span style={{ fontWeight: state.lang === 'en' ? 'bold' : 'normal', color: state.lang === 'en' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>EN</span>
      <span style={{ color: 'var(--text-tertiary)' }}>/</span>
      <span style={{ fontWeight: state.lang === 'th' ? 'bold' : 'normal', color: state.lang === 'th' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>TH</span>
    </button>
  )
}
