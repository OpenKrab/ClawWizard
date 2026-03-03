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

      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>{t('checking_system')}</div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>
              {isReady ? '✅' : '⚠️'}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-sm)', color: isReady ? 'var(--status-success)' : 'var(--status-error)' }}>
              {isReady ? t('openclaw_installed') : t('openclaw_not_found')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              {isReady 
                ? `${t('version')}: ${status?.openclaw?.version || 'Unknown'} | ${t('node')}: ${status?.node?.version}`
                : t('install_to_proceed')}
            </p>

            {!isReady && (
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAutoInstall}
                  disabled={installing}
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  {installing ? t('installing_wait') : t('install_auto')}
                </button>
                <button className="btn btn-ghost" onClick={checkStatus} disabled={installing}>
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
