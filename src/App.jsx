import { Routes, Route, useNavigate } from 'react-router-dom'
import { useWizard } from './context/WizardContext'
import WelcomePage from './pages/WelcomePage'
import ModelAuthPage from './pages/ModelAuthPage'
import WorkspacePage from './pages/WorkspacePage'
import GatewayPage from './pages/GatewayPage'
import ChannelsPage from './pages/ChannelsPage'
import ToolsSkillsPage from './pages/ToolsSkillsPage'
import PreviewDeployPage from './pages/PreviewDeployPage'
import DiagnosticsPage from './pages/DiagnosticsPage'
import { useEffect } from 'react'

const STEP_ROUTES = ['/', '/model', '/workspace', '/gateway', '/channels', '/tools', '/deploy']

export default function App() {
  const { state, STEPS, goToStep } = useWizard()
  const navigate = useNavigate()

  useEffect(() => {
    navigate(STEP_ROUTES[state.currentStep] || '/')
  }, [state.currentStep])

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="logo">
          <span className="logo-icon">🦞</span>
          <span className="logo-text">ClawWizard</span>
          <span className="logo-version">v1.0</span>
        </div>

        <ul className="step-list">
          {STEPS.map((step, i) => {
            const isCompleted = state.completedSteps.includes(i)
            const isActive = state.currentStep === i
            const canNav = i <= Math.max(...state.completedSteps, state.currentStep, 0)

            return (
              <li
                key={step.id}
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!canNav ? 'disabled' : ''}`}
                onClick={() => canNav && goToStep(i)}
              >
                <span className="step-number">
                  {isCompleted ? '✓' : i + 1}
                </span>
                <span className="step-label">{step.label}</span>
              </li>
            )
          })}
        </ul>

        <div className="sidebar-footer">
          <div className="diag-link" onClick={() => navigate('/diagnostics')}>
            <span>🩺</span>
            <span>Diagnostics</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/model" element={<ModelAuthPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/gateway" element={<GatewayPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/tools" element={<ToolsSkillsPage />} />
          <Route path="/deploy" element={<PreviewDeployPage />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
        </Routes>
      </main>
    </div>
  )
}
