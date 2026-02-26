import { useState } from 'react'
import { useWizard } from '../context/WizardContext'

export default function ThemeSwitcher() {
  const { state, dispatch } = useWizard()
  const [isAnimating, setIsAnimating] = useState(false)

  const toggleTheme = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
    
    // Dispatch theme change
    dispatch({ type: 'SET_THEME', payload: newTheme })
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <button
      onClick={toggleTheme}
      disabled={isAnimating}
      className="theme-switcher"
      aria-label={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="switch-track">
        <div className="switch-thumb" />
      </div>
      <span className="switch-label">
        {state.theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}