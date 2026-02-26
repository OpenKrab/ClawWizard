import { useState } from 'react'
import { useWizard } from '../context/WizardContext'
import { PERSONALITY_PRESETS, WORKSPACE_TEMPLATES } from '../data/templates'

export default function WorkspacePage() {
  const { state, dispatch, nextStep, prevStep } = useWizard()
  const [activeFile, setActiveFile] = useState('SOUL.md')
  const [showTemplates, setShowTemplates] = useState(false)

  const files = Object.keys(WORKSPACE_TEMPLATES)
  const availableTemplates = WORKSPACE_TEMPLATES[activeFile] || []

  const handlePreset = (preset) => {
    dispatch({ type: 'SET_SOUL_MD', payload: preset.soul })
  }

  const handleFileChange = (content) => {
    dispatch({
      type: 'SET_WORKSPACE_FILE',
      payload: { name: activeFile, content }
    })
  }

  const applyTemplate = (content, mode = 'replace') => {
    if (mode === 'append') {
      const current = state.workspaceFiles[activeFile] || ''
      handleFileChange(current ? current + '\n\n' + content : content)
    } else {
      handleFileChange(content)
    }
    setShowTemplates(false)
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Workspace & Personality</h1>
        <p className="page-subtitle">
          Configure where your agent lives and how it behaves. OpenClaw uses system files to bootstrap behavior.
        </p>
      </div>

      {/* Workspace Path */}
      <div className="form-section">
        <h3 className="form-section-title">📁 Workspace Path</h3>
        <div className="field">
          <input
            className="field-input mono"
            type="text"
            value={state.config.agents.defaults.workspace}
            onChange={(e) => dispatch({
              type: 'UPDATE_CONFIG',
              payload: { agents: { defaults: { workspace: e.target.value } } },
            })}
          />
          <span className="field-hint">
            System files (AGENTS.md, SOUL.md, TOOLS.md, etc.) will be stored here
          </span>
        </div>
      </div>

      {/* Personality Presets (Only for SOUL.md) */}
      {activeFile === 'SOUL.md' && (
        <div className="form-section animate-in">
          <h3 className="form-section-title">🎭 Personality Preset</h3>
          <div className="card-grid card-grid-4">
            {PERSONALITY_PRESETS.map((preset, i) => (
              <div
                key={preset.id}
                className={`glass-card clickable animate-in animate-in-delay-${i + 1} ${state.soulMd === preset.soul ? 'selected' : ''}`}
                onClick={() => handlePreset(preset)}
                style={{ padding: 'var(--space-md)', textAlign: 'center' }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{preset.name}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{preset.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-file Editor */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>📝 System Files</h3>
          <button 
            className={`btn btn-sm ${showTemplates ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setShowTemplates(!showTemplates)}
          >
            {showTemplates ? '✕ Close' : '✨ Templates'}
          </button>
        </div>

        {/* Template Gallery */}
        {showTemplates && (
          <div className="animate-in" style={{ 
            background: 'var(--glass-bg-elevated)', 
            padding: 'var(--space-md)', 
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            border: '1px solid var(--accent-primary)',
          }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-accent)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Template for {activeFile}
            </h4>
            <div className="card-grid card-grid-3">
              {availableTemplates.map(tpl => (
                <div key={tpl.id} className="glass-card" style={{ padding: 'var(--space-sm)' }}>
                  <h5 style={{ fontSize: '13px', marginBottom: '6px' }}>{tpl.name}</h5>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      style={{ flex: 1, fontSize: '10px' }}
                      onClick={() => applyTemplate(tpl.content, 'replace')}
                    >
                      Replace
                    </button>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      style={{ flex: 1, fontSize: '10px' }}
                      onClick={() => applyTemplate(tpl.content, 'append')}
                    >
                      Append
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '2px', 
          overflowX: 'auto', 
          marginBottom: '-1px', 
          paddingBottom: '2px',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          {files.map(file => (
            <button
              key={file}
              onClick={() => { setActiveFile(file); setShowTemplates(false); }}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                background: activeFile === file ? 'var(--glass-bg-elevated)' : 'transparent',
                color: activeFile === file ? 'var(--text-accent)' : 'var(--text-tertiary)',
                border: '1px solid ' + (activeFile === file ? 'var(--glass-border)' : 'transparent'),
                borderBottomColor: activeFile === file ? 'var(--bg-primary)' : 'transparent',
                borderRadius: '6px 6px 0 0',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {state.workspaceFiles[file] ? '● ' : ''}{file}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            className="code-editor"
            value={state.workspaceFiles[activeFile] || ''}
            onChange={(e) => handleFileChange(e.target.value)}
            placeholder={`Content for ${activeFile}...`}
            rows={14}
            style={{ 
              borderTopLeftRadius: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: '1.6'
            }}
          />
          {(!state.workspaceFiles[activeFile] && !showTemplates) && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              opacity: 0.5
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>File is empty</p>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ pointerEvents: 'auto', marginTop: 'var(--space-sm)' }}
                onClick={() => setShowTemplates(true)}
              >
                Choose a Template
              </button>
            </div>
          )}
        </div>
        
        <span className="field-hint" style={{ marginTop: 'var(--space-xs)' }}>
          {activeFile === 'SOUL.md' 
            ? 'Defines overall personality and system prompt.' 
            : `Defines ${activeFile.toLowerCase().replace('.md', '')} configuration.`}
        </span>
      </div>

      <div className="nav-footer">
        <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
        <button className="btn btn-primary" onClick={nextStep}>Continue →</button>
      </div>
    </div>
  )
}
