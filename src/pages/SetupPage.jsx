import { useState, useEffect } from 'react'
import { useWizard } from '../context/WizardContext'

export default function SetupPage() {
  const { nextStep } = useWizard()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/check-system')
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      console.error('Check failed', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoInstall = async () => {
    setInstalling(true)
    try {
      const res = await fetch('/api/install-openclaw', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        checkStatus()
      } else {
        alert('Install failed. Please try manual installation.\n' + (data.output || ''))
      }
    } catch (e) {
      alert('Error during install: ' + e.message)
    } finally {
      setInstalling(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const isReady = status?.openclaw?.installed

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">
          Environment Setup ⚙️
        </h1>
        <p className="page-subtitle">
          Before we begin, let's make sure you have the OpenClaw engine installed on your system.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Checking system... ⏳</div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>
              {isReady ? '✅' : '⚠️'}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-sm)', color: isReady ? 'var(--status-success)' : 'var(--status-error)' }}>
              {isReady ? 'OpenClaw is Installed' : 'OpenClaw Not Found'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              {isReady 
                ? `Version: ${status?.openclaw?.version || 'Unknown'} | Node: ${status?.node?.version}`
                : 'You need to install the OpenClaw CLI to proceed with the setup.'}
            </p>

            {!isReady && (
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAutoInstall}
                  disabled={installing}
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  {installing ? '⏳ Installing... Please wait' : '✨ Install OpenClaw Automatically'}
                </button>
                <button className="btn btn-ghost" onClick={checkStatus} disabled={installing}>
                  🔄 Recheck
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isReady && !loading && (
        <div className="form-section">
          <h3 className="form-section-title">📦 Manual Install Guide (Fallback)</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
            If the automatic installation fails, try running one of these commands on your terminal.
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
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <p className="field-hint" style={{ marginBottom: 'var(--space-sm)' }}>Or simply use npm:</p>
            <code style={{ display: 'inline-block', fontSize: '14px', background: 'var(--bg-primary)', padding: '10px 20px', borderRadius: 'var(--radius-md)', color: 'var(--text-accent)', border: '1px solid var(--border-color)' }}>
              npm install -g openclaw@latest
            </code>
          </div>
        </div>
      )}

      <div className="nav-footer">
        <div />
        <button 
          className={`btn ${isReady ? 'btn-primary' : 'btn-default'} btn-lg`}
          onClick={() => isReady ? nextStep() : alert('Please install OpenClaw first!')}
          disabled={!isReady || loading}
        >
          {isReady ? 'Continue →' : 'Waiting for installation...'}
        </button>
      </div>
    </div>
  )
}
