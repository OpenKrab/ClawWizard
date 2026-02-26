import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WizardProvider, useWizard } from './context/WizardContext'
import App from './App'
import './index.css'

// Theme wrapper component
function ThemeWrapper({ children }) {
  const { state } = useWizard()
  
  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [state.theme])
  
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <WizardProvider>
        <ThemeWrapper>
          <App />
        </ThemeWrapper>
      </WizardProvider>
    </BrowserRouter>
  </React.StrictMode>
)
