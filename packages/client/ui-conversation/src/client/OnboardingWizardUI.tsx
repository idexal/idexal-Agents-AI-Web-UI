/**
 * Onboarding Wizard UI for Idexal Agents.
 * Beautiful, step-by-step wizard for new users.
 * Now with enhanced RTL layout support for Arabic.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getOnboardingWizard,
  WIZARD_TRANSLATIONS,
  type WizardState,
  type UserProfile,
  type UserPreferences,
} from './OnboardingWizard.ts'

/** Language type */
type Language = 'en' | 'ar' | 'zh'

/** Wizard Props */
export interface OnboardingWizardUIProps {
  language?: Language
  onComplete?: (data: { profile: UserProfile; preferences: UserPreferences }) => void
  onSkip?: () => void
}

/**
 * Onboarding Wizard UI Component.
 */
export function OnboardingWizardUI({
  language = 'en',
  onComplete,
  onSkip,
}: OnboardingWizardUIProps) {
  const t = WIZARD_TRANSLATIONS[language] ?? WIZARD_TRANSLATIONS.en ?? {}
  const isRTL = language === 'ar'

  const [engine] = useState(() => getOnboardingWizard())
  const [state, setState] = useState<WizardState>(engine.getState())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [theme, setTheme] = useState<UserPreferences['theme']>('system')
  const [lang, setLang] = useState<Language>(language)
  const [notifications, setNotifications] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [fontSize, setFontSize] = useState<UserPreferences['fontSize']>('medium')

  useEffect(() => {
    const unsub = engine.subscribe(setState)
    if (engine.shouldShow()) {
      engine.start()
    }
    return unsub
  }, [engine])

  useEffect(() => {
    if (state.isCompleted) {
      onComplete?.({ profile: state.profile, preferences: state.preferences })
    }
  }, [state.isCompleted, onComplete, state.profile, state.preferences])

  const handleNext = useCallback(() => {
    // Save current step data
    const currentStep = engine.getCurrentStep()
    if (currentStep?.type === 'profile') {
      engine.updateProfile({ name, email, role, bio })
    } else if (currentStep?.type === 'preferences') {
      engine.updatePreferences({ theme, language: lang, notifications, compactMode, fontSize })
    }
    engine.next()
  }, [engine, name, email, role, bio, theme, lang, notifications, compactMode, fontSize])

  const handleBack = useCallback(() => {
    engine.back()
  }, [engine])

  const handleSkip = useCallback(() => {
    engine.skip()
  }, [engine])

  const handleFinish = useCallback(() => {
    engine.updateProfile({ name, email, role, bio })
    engine.updatePreferences({ theme, language: lang, notifications, compactMode, fontSize })
    engine.complete()
  }, [engine, name, email, role, bio, theme, lang, notifications, compactMode, fontSize])

  const handleSkipAll = useCallback(() => {
    engine.skipAll()
    onSkip?.()
  }, [engine, onSkip])

  if (!engine.shouldShow() && !state.startedAt) {
    return null
  }

  const currentStep = engine.getCurrentStep()
  const progress = engine.getProgress()
  const isFirstStep = state.currentStepIndex === 0
  const isLastStep = state.currentStepIndex === state.steps.length - 1
  const allowSkip = true

  return (
    <div className="onboarding-overlay" dir={isRTL ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-label="Onboarding Wizard">
      <div className="onboarding-modal">
        {/* Progress Bar */}
        <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Onboarding progress: ${Math.round(progress)}%`}></div>

        {/* Step Indicators */}
        <div className="step-indicators" role="tablist" aria-label="Onboarding steps">
          {state.steps.map((step, index) => (
            <div
              key={step.id}
              className={`step-dot ${
                index < state.currentStepIndex ? 'completed' :
                index === state.currentStepIndex ? 'active' : 'pending'
              }`}
              role="tab"
              aria-selected={index === state.currentStepIndex}
              aria-label={`Step ${index + 1}: ${step.title}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="step-content" role="tabpanel" aria-label={currentStep?.title ?? ''}>
          {currentStep?.type === 'welcome' && (
            <WelcomeStep t={t} isRTL={isRTL} />
          )}
          {currentStep?.type === 'profile' && (
            <ProfileStep
              t={t}
              name={name}
              email={email}
              role={role}
              bio={bio}
              isRTL={isRTL}
              onNameChange={setName}
              onEmailChange={setEmail}
              onRoleChange={setRole}
              onBioChange={setBio}
            />
          )}
          {currentStep?.type === 'preferences' && (
            <PreferencesStep
              t={t}
              theme={theme}
              language={lang}
              notifications={notifications}
              compactMode={compactMode}
              fontSize={fontSize}
              isRTL={isRTL}
              onThemeChange={setTheme}
              onLanguageChange={setLang}
              onNotificationsChange={setNotifications}
              onCompactModeChange={setCompactMode}
              onFontSizeChange={setFontSize}
            />
          )}
          {currentStep?.type === 'tutorial' && (
            <TutorialStep t={t} isRTL={isRTL} />
          )}
          {currentStep?.type === 'complete' && (
            <CompleteStep t={t} isRTL={isRTL} />
          )}
        </div>

        {/* Navigation */}
        <div className="navigation" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {!isFirstStep && (
            <button className="nav-btn back" onClick={handleBack} aria-label={t.back}>
              {isRTL ? '\u{2192}' : '\u{2190}'} {t.back}
            </button>
          )}

          <div className="nav-spacer" />

          {allowSkip && !isLastStep && (
            <button className="nav-btn skip" onClick={handleSkip} aria-label={t.skip}>
              {t.skip}
            </button>
          )}

          {isLastStep ? (
            <button className="nav-btn finish" onClick={handleFinish} aria-label={t.finish}>
              {t.finish} {isRTL ? '\u{2190}' : '\u{2192}'}
            </button>
          ) : (
            <button className="nav-btn next" onClick={handleNext} aria-label={t.next}>
              {t.next} {isRTL ? '\u{2190}' : '\u{2192}'}
            </button>
          )}
        </div>

        {/* Skip All */}
        <button className="skip-all" onClick={handleSkipAll} style={isRTL ? { left: 12, right: 'auto' } : undefined} aria-label="Skip all steps">
          {t.skip} All
        </button>
      </div>

      <style>{`
        .onboarding-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .onboarding-modal {
          position: relative;
          width: 520px;
          max-width: 95vw;
          max-height: 90vh;
          background: var(--bg-primary, #ffffff);
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .progress-bar {
          height: 4px;
          background: var(--border-primary, #e5e7eb);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
          transform-origin: left;
        }

        .step-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 16px;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border-primary, #e5e7eb);
          transition: all 0.3s ease;
        }

        .step-dot.active {
          background: #3b82f6;
          transform: scale(1.3);
        }

        .step-dot.completed {
          background: #10b981;
        }

        .step-content {
          flex: 1;
          padding: 0 32px 24px;
          overflow-y: auto;
          min-height: 320px;
        }

        .step-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          margin-bottom: 8px;
          text-align: center;
        }

        .step-description {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          text-align: center;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .welcome-icon {
          font-size: 72px;
          text-align: center;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 8px;
          font-size: 14px;
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #111827);
          transition: border-color 0.15s;
          outline: none;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .option-card {
          padding: 16px 12px;
          border: 2px solid var(--border-primary, #e5e7eb);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-primary, #ffffff);
        }

        .option-card:hover {
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .option-card.selected {
          border-color: #3b82f6;
          background: #dbeafe;
        }

        .option-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .option-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #111827);
        }

        .option-desc {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          margin-top: 4px;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-light, #f3f4f6);
        }

        .toggle-info {
          flex: 1;
        }

        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #111827);
        }

        .toggle-desc {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--border-primary, #e5e7eb);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .toggle-switch.active {
          background: #3b82f6;
        }

        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        .toggle-switch.active .toggle-knob {
          transform: translateX(20px);
        }

        .tutorial-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tutorial-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 12px;
          border: 1px solid var(--border-light, #f3f4f6);
        }

        .tutorial-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 12px;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }

        .tutorial-text h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }

        .tutorial-text p {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .complete-icon {
          font-size: 80px;
          text-align: center;
          margin-bottom: 24px;
        }

        .complete-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 24px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-primary, #111827);
        }

        .feature-check {
          color: #10b981;
          font-weight: bold;
        }

        .navigation {
          display: flex;
          align-items: center;
          padding: 16px 32px;
          border-top: 1px solid var(--border-light, #f3f4f6);
          background: var(--bg-secondary, #f9fafb);
        }

        .nav-spacer {
          flex: 1;
        }

        .nav-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-btn.back {
          background: none;
          border: 1px solid var(--border-primary, #e5e7eb);
          color: var(--text-secondary, #6b7280);
        }

        .nav-btn.back:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .nav-btn.skip {
          background: none;
          color: var(--text-secondary, #6b7280);
          margin-right: 8px;
        }

        .nav-btn.skip:hover {
          color: var(--text-primary, #111827);
        }

        .nav-btn.next, .nav-btn.finish {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .nav-btn.next:hover, .nav-btn.finish:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }

        .skip-all {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .skip-all:hover {
          background: var(--bg-hover, #f3f4f6);
          color: var(--text-secondary, #6b7280);
        }
      `}</style>
    </div>
  )
}

/** Welcome Step */
function WelcomeStep({ t, isRTL }: { t: Record<string, string>; isRTL: boolean }) {
  return (
    <div className="step-center">
      <div className="welcome-icon">
        {'\u{1F680}'}
      </div>
      <h2 className="step-title">{t.welcome}</h2>
      <p className="step-description">{t.welcomeDesc}</p>

      <div className="welcome-features" style={{ textAlign: isRTL ? 'right' : 'left' }}>
        <div className="feature-item">
          <span className="feature-check">{'\u2713'}</span>
          AI-Powered Development
        </div>
        <div className="feature-item">
          <span className="feature-check">{'\u2713'}</span>
          Team Collaboration
        </div>
        <div className="feature-item">
          <span className="feature-check">{'\u2713'}</span>
          Export & Share
        </div>
        <div className="feature-item">
          <span className="feature-check">{'\u2713'}</span>
          Multi-Language Support
        </div>
      </div>
    </div>
  )
}

/** Profile Step */
function ProfileStep({
  t, name, email, role, bio, isRTL, onNameChange, onEmailChange, onRoleChange, onBioChange,
}: {
  t: Record<string, string>
  name: string; email: string; role: string; bio: string
  isRTL: boolean
  onNameChange: (v: string) => void; onEmailChange: (v: string) => void
  onRoleChange: (v: string) => void; onBioChange: (v: string) => void
}) {
  const textAlign = isRTL ? 'right' : 'left'
  const dir = isRTL ? 'rtl' : 'ltr'

  return (
    <div>
      <h2 className="step-title">{t.profile}</h2>
      <p className="step-description">{t.profileDesc}</p>

      <div className="form-group">
        <label className="form-label" style={{ textAlign }}>{t.name}</label>
        <input
          className="form-input"
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          dir={dir}
          style={{ textAlign }}
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ textAlign }}>{t.email}</label>
        <input
          className="form-input"
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          dir="ltr"
          style={{ textAlign: 'left' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ textAlign }}>{t.role}</label>
        <input
          className="form-input"
          type="text"
          placeholder={t.rolePlaceholder}
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          dir={dir}
          style={{ textAlign }}
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ textAlign }}>{t.bio}</label>
        <textarea
          className="form-input form-textarea"
          placeholder={t.bioPlaceholder}
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          dir={dir}
          style={{ textAlign }}
        />
      </div>
    </div>
  )
}

/** Preferences Step */
function PreferencesStep({
  t, theme, language: _language, notifications, compactMode, fontSize, isRTL,
  onThemeChange, onLanguageChange: _onLanguageChange, onNotificationsChange, onCompactModeChange, onFontSizeChange,
}: {
  t: Record<string, string>
  theme: UserPreferences['theme']; language: string
  notifications: boolean; compactMode: boolean; fontSize: UserPreferences['fontSize']
  isRTL: boolean
  onThemeChange: (v: UserPreferences['theme']) => void; onLanguageChange: (v: 'en' | 'ar' | 'zh') => void
  onNotificationsChange: (v: boolean) => void; onCompactModeChange: (v: boolean) => void
  onFontSizeChange: (v: UserPreferences['fontSize']) => void
}) {
  return (
    <div>
      <h2 className="step-title">{t.preferences}</h2>
      <p className="step-description">{t.preferencesDesc}</p>

      <div className="form-group">
        <label className="form-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.theme}</label>
        <div className="option-grid">
          <div
            className={`option-card ${theme === 'light' ? 'selected' : ''}`}
            onClick={() => onThemeChange('light')}
          >
            <div className="option-icon">{'\u2600\uFE0F'}</div>
            <div className="option-label">{t.themeLight}</div>
          </div>
          <div
            className={`option-card ${theme === 'dark' ? 'selected' : ''}`}
            onClick={() => onThemeChange('dark')}
          >
            <div className="option-icon">{'\u{1F319}'}</div>
            <div className="option-label">{t.themeDark}</div>
          </div>
          <div
            className={`option-card ${theme === 'system' ? 'selected' : ''}`}
            onClick={() => onThemeChange('system')}
          >
            <div className="option-icon">{'\u{1F4BB}'}</div>
            <div className="option-label">{t.themeSystem}</div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.fontSize}</label>
        <div className="option-grid">
          <div
            className={`option-card ${fontSize === 'small' ? 'selected' : ''}`}
            onClick={() => onFontSizeChange('small')}
          >
            <div className="option-label">A</div>
            <div className="option-desc">{t.fontSizeSmall}</div>
          </div>
          <div
            className={`option-card ${fontSize === 'medium' ? 'selected' : ''}`}
            onClick={() => onFontSizeChange('medium')}
          >
            <div className="option-label" style={{ fontSize: '16px' }}>A</div>
            <div className="option-desc">{t.fontSizeMedium}</div>
          </div>
          <div
            className={`option-card ${fontSize === 'large' ? 'selected' : ''}`}
            onClick={() => onFontSizeChange('large')}
          >
            <div className="option-label" style={{ fontSize: '20px' }}>A</div>
            <div className="option-desc">{t.fontSizeLarge}</div>
          </div>
        </div>
      </div>

      <div className="toggle-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div className="toggle-info" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <div className="toggle-label">{t.notifications}</div>
          <div className="toggle-desc">{t.notificationsDesc}</div>
        </div>
        <div
          className={`toggle-switch ${notifications ? 'active' : ''}`}
          onClick={() => onNotificationsChange(!notifications)}
        >
          <div className="toggle-knob" />
        </div>
      </div>

      <div className="toggle-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div className="toggle-info" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <div className="toggle-label">{t.compactMode}</div>
          <div className="toggle-desc">{t.compactModeDesc}</div>
        </div>
        <div
          className={`toggle-switch ${compactMode ? 'active' : ''}`}
          onClick={() => onCompactModeChange(!compactMode)}
        >
          <div className="toggle-knob" />
        </div>
      </div>
    </div>
  )
}

/** Tutorial Step */
function TutorialStep({ t, isRTL }: { t: Record<string, string>; isRTL: boolean }) {
  return (
    <div>
      <h2 className="step-title">{t.tutorial}</h2>
      <p className="step-description">{t.tutorialDesc}</p>

      <div className="tutorial-cards">
        <div className="tutorial-card" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div className="tutorial-icon">{'\u{1F4AC}'}</div>
          <div className="tutorial-text" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <h4>{t.tutorialChat}</h4>
            <p>{t.tutorialChatDesc}</p>
          </div>
        </div>

        <div className="tutorial-card" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div className="tutorial-icon">{'\u{1F50D}'}</div>
          <div className="tutorial-text" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <h4>{t.tutorialSearch}</h4>
            <p>{t.tutorialSearchDesc}</p>
          </div>
        </div>

        <div className="tutorial-card" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div className="tutorial-icon">{'\u{1F4E4}'}</div>
          <div className="tutorial-text" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <h4>{t.tutorialExport}</h4>
            <p>{t.tutorialExportDesc}</p>
          </div>
        </div>

        <div className="tutorial-card" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div className="tutorial-icon">{'\u{1F91D}'}</div>
          <div className="tutorial-text" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <h4>{t.tutorialCollab}</h4>
            <p>{t.tutorialCollabDesc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Complete Step */
function CompleteStep({ t, isRTL }: { t: Record<string, string>; isRTL: boolean }) {
  return (
    <div className="step-center">
      <div className="complete-icon">
        {'\u{1F389}'}
      </div>
      <h2 className="step-title">{t.complete}</h2>
      <p className="step-description">{t.completeDesc}</p>

      <div className="complete-features" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        <div className="feature-item" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="feature-check">{'\u2713'}</span>
          AI Chat Ready
        </div>
        <div className="feature-item" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="feature-check">{'\u2713'}</span>
          Dark Mode
        </div>
        <div className="feature-item" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="feature-check">{'\u2713'}</span>
          Export Tools
        </div>
        <div className="feature-item" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="feature-check">{'\u2713'}</span>
          Smart Suggestions
        </div>
      </div>
    </div>
  )
}

export default OnboardingWizardUI
