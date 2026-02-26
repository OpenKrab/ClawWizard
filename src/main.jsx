import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WizardProvider } from './context/WizardContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <WizardProvider>
        <App />
      </WizardProvider>
    </BrowserRouter>
  </React.StrictMode>
)
