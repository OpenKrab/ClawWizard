import { useState, useEffect } from 'react'
import { useWizard } from '../context/WizardContext'
import { useTranslation } from '../i18n'

export default function SetupPage() {
  const { nextStep } = useWizard()
  const { t } = useTranslation()
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
        alert(t('install_failed') + '\n' + (data.output || ''))
      }
    } catch (e) {
      alert(t('error_install') + e.message)
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
          {t('setup_title')}
        </h1>
        <p className="page-subtitle">
          {t('setup_subtitle')}
        </p>
      </div>

      <div className="glass-card" style={{ 
        padding: 'var(--space-3xl)', 
        marginBottom: 'var(--space-2xl)', 
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: isReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          zIndex: -1
        }} />

        {loading ? (
          <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '200px', height: '24px' }} />
            <div className="skeleton" style={{ width: '150px', height: '16px' }} />
          </div>
        ) : (
          <div className="animate-scale">
            <div style={{ 
              fontSize: '64px', 
              marginBottom: 'var(--space-md)',
              textShadow: isReady ? '0 0 20px rgba(34, 197, 94, 0.4)' : '0 0 20px rgba(239, 68, 68, 0.4)'
            }}>
              {isReady ? '✅' : '⚠️'}
            </div>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              marginBottom: 'var(--space-sm)', 
              color: isReady ? 'var(--status-success)' : 'var(--status-error)',
              letterSpacing: '-0.02em'
            }}>
              {isReady ? t('openclaw_installed') : t('openclaw_not_found')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '1.1rem' }}>
              {isReady 
                ? `${t('version')}: ${status?.openclaw?.version || 'Unknown'} | ${t('node')}: ${status?.node?.version}`
                : t('install_to_proceed')}
            </p>

            {!isReady && (
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <button 
                  className={`btn ${installing ? 'btn-ghost' : 'btn-primary'} btn-lg`} 
                  onClick={handleAutoInstall}
                  disabled={installing}
                  style={{ minWidth: '200px' }}
                >
                  {installing ? (
                    <span className="animate-pulse">⏳ {t('installing_wait')}</span>
                  ) : t('install_auto')}
                </button>
                <button className="btn btn-secondary btn-lg" onClick={checkStatus} disabled={installing}>
                  {t('recheck_status')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isReady && !loading && (
        <div className="form-section">
          <h3 className="form-section-title">{t('manual_guide_title')}</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-lg)' }}>
            {t('manual_guide_desc')}
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
            <p className="field-hint" style={{ marginBottom: 'var(--space-sm)' }}>{t('or_use_npm')}</p>
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
          onClick={() => isReady ? nextStep() : alert(t('alert_install_first'))}
          disabled={!isReady || loading}
        >
          {isReady ? t('btn_continue') : t('waiting_install')}
        </button>
      </div>
    </div>
  )
}
