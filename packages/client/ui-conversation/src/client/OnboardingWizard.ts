/**
 * Onboarding Wizard Engine for Idexal Agents.
 * Provides guided setup for new users with step management and persistence.
 */

/** Wizard step types */
export type StepType = 'welcome' | 'profile' | 'preferences' | 'tutorial' | 'complete'

/** Wizard step status */
export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped'

/** Wizard step */
export interface WizardStep {
  id: string
  type: StepType
  title: string
  description: string
  status: StepStatus
  order: number
  isRequired: boolean
  data: Record<string, unknown> | undefined
}

/** User profile data */
export interface UserProfile {
  name: string
  email: string | undefined
  avatar: string | undefined
  role: string | undefined
  bio: string | undefined
}

/** User preferences */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'ar' | 'zh'
  notifications: boolean
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
}

/** Wizard configuration */
export interface WizardConfig {
  /** Enable onboarding wizard */
  enabled: boolean
  /** Storage key for persistence */
  storageKey: string
  /** Auto-show on first visit */
  autoShow: boolean
  /** Allow skipping steps */
  allowSkip: boolean
  /** Callback when wizard completes */
  onComplete: ((data: WizardData) => void) | undefined
  /** Callback when wizard is skipped */
  onSkip: ((step: WizardStep) => void) | undefined
  /** Callback on step change */
  onStepChange: ((step: WizardStep) => void) | undefined
}

/** Complete wizard data */
export interface WizardData {
  profile: UserProfile
  preferences: UserPreferences
  completedSteps: string[]
  completedAt: Date
}

/** Wizard state */
export interface WizardState {
  steps: WizardStep[]
  currentStepIndex: number
  profile: UserProfile
  preferences: UserPreferences
  isCompleted: boolean
  isSkipped: boolean
  startedAt: Date | undefined
  completedAt: Date | undefined
}

/** Translations */
export const WIZARD_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome to Idexal Agents',
    welcomeDesc: 'Your AI-powered development companion. Let us help you get started.',
    profile: 'Your Profile',
    profileDesc: 'Tell us a bit about yourself to personalize your experience.',
    name: 'Full Name',
    namePlaceholder: 'Enter your name',
    email: 'Email Address',
    emailPlaceholder: 'your@email.com',
    role: 'Your Role',
    rolePlaceholder: 'e.g., Developer, Designer, PM',
    bio: 'Short Bio',
    bioPlaceholder: 'Tell us about yourself...',
    preferences: 'Preferences',
    preferencesDesc: 'Customize your experience.',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'Language',
    notifications: 'Enable Notifications',
    notificationsDesc: 'Receive updates about your conversations',
    compactMode: 'Compact Mode',
    compactModeDesc: 'Reduce spacing for more content',
    fontSize: 'Font Size',
    fontSizeSmall: 'Small',
    fontSizeMedium: 'Medium',
    fontSizeLarge: 'Large',
    tutorial: 'Quick Tour',
    tutorialDesc: 'Learn the basics of Idexal Agents.',
    tutorialChat: 'Start a conversation with AI',
    tutorialChatDesc: 'Type your message and press Enter',
    tutorialSearch: 'Search your conversations',
    tutorialSearchDesc: 'Use Ctrl+K to quickly find anything',
    tutorialExport: 'Export your chats',
    tutorialExportDesc: 'Save conversations as PDF, Markdown, or JSON',
    tutorialCollab: 'Collaborate with your team',
    tutorialCollabDesc: 'Share conversations and work together',
    complete: 'You are All Set!',
    completeDesc: 'Your account is ready. Start exploring Idexal Agents!',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    finish: 'Get Started',
    startTour: 'Start Tour',
    goToChat: 'Go to Chat',
  },
  ar: {
    welcome: '\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643 \u0641\u064a Idexal Agents',
    welcomeDesc: '\u0631\u0641\u064a\u0642\u0643 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0644\u062a\u0637\u0648\u064a\u0631. \u062f\u0639\u0646\u0627 \u0644\u0628\u062f\u0621.',
    profile: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a \u0627\u0644\u0639\u0627\u0645',
    profileDesc: '\u0623\u062e\u0628\u0631\u0646\u0627 \u0639\u0646 \u0646\u0641\u0633\u0643 \u0644\u062a\u062e\u0635\u064a\u0639 \u062a\u062c\u0631\u0628\u062a\u0643.',
    name: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644',
    namePlaceholder: '\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643',
    email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    emailPlaceholder: '\u0628\u0631\u064a\u062f\u0643@\u0628\u0631\u064a\u062f.com',
    role: '\u062f\u0648\u0631\u0643',
    rolePlaceholder: '\u0645\u062b\u0644. \u0645\u0648\u0627\u0635\u0641 \u0628\u0631\u0645\u062c\u064a\u0627\u062a',
    bio: '\u0646\u0628\u0630\u0629 \u0645\u0642\u062a\u0635\u0631\u0629',
    bioPlaceholder: '\u062d\u062f\u062b \u0639\u0646 \u0646\u0641\u0633\u0643...',
    preferences: '\u0627\u0644\u062a\u0641\u0636\u064a\u0644\u0627\u062a',
    preferencesDesc: '\u062e\u0635\u0635 \u062a\u062c\u0631\u0628\u062a\u0643.',
    theme: '\u0627\u0644\u0633\u0645\u0629',
    themeLight: '\u0641\u0627\u062a\u062d',
    themeDark: '\u0645\u0638\u0644\u0645',
    themeSystem: '\u0627\u0644\u0646\u0638\u0627\u0645',
    language: '\u0627\u0644\u0644\u063a\u0629',
    notifications: '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a',
    notificationsDesc: '\u062a\u0644\u0642\u064a \u0628\u0627\u0644\u062a\u062d\u062f\u064a\u062b\u0627\u062a',
    compactMode: '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062f\u0645\u062c',
    compactModeDesc: '\u062a\u0642\u0644\u064a\u0644 \u0627\u0644\u0645\u0633\u0627\u0641\u0627\u062a',
    fontSize: '\u062d\u062c\u0645 \u0627\u0644\u062e\u0637',
    fontSizeSmall: '\u0635\u063a\u064a\u0631',
    fontSizeMedium: '\u0645\u062a\u0648\u0633\u0637',
    fontSizeLarge: '\u0643\u0628\u064a\u0631',
    tutorial: '\u062c\u0648\u0644\u0629 \u0633\u0631\u064a\u0639\u0629',
    tutorialDesc: '\u062a\u0639\u0631\u0641 \u0639\u0644\u0649 \u0623\u0633\u0627\u0633\u064a\u0627\u062a Idexal Agents.',
    tutorialChat: '\u0628\u062f\u0623 \u0645\u062d\u0627\u062f\u062b\u0629',
    tutorialChatDesc: '\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u062a\u0643 \u0648\u0627\u0636\u063a\u0637 Enter',
    tutorialSearch: '\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0627\u062a',
    tutorialSearchDesc: '\u0627\u0633\u062a\u062e\u062f\u0645 Ctrl+K \u0644\u0644\u0628\u062d\u062b \u0627\u0644\u0633\u0631\u064a\u0639',
    tutorialExport: '\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0627\u062a',
    tutorialExportDesc: '\u062d\u0641\u0638 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0627\u062a \u0643\u0628\u0646\u062f PDF',
    tutorialCollab: '\u0627\u0644\u062a\u0639\u0627\u0648\u0646 \u0645\u0639 \u0627\u0644\u0641\u0631\u064a\u0642',
    tutorialCollabDesc: '\u0634\u0631\u0643 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0627\u062a \u0648\u0627\u0639\u0645\u0644 \u0645\u0639\u0627',
    complete: '\u0623\u0646\u062a \u062c\u0627\u0647\u0632!',
    completeDesc: '\u062d\u0633\u0627\u0628\u0643 \u062c\u0627\u0647\u0632. \u0627\u0628\u062f\u0623 \u0627\u0633\u062a\u0643\u0634\u0641 Idexal Agents!',
    next: '\u0627\u0644\u062a\u0627\u0644\u064a',
    back: '\u0627\u0644\u0633\u0627\u0628\u0642',
    skip: '\u062a\u062e\u0637\u064a',
    finish: '\u0628\u062f\u0623',
    startTour: '\u0628\u062f\u0623 \u0627\u0644\u062c\u0648\u0644\u0629',
    goToChat: '\u0627\u0644\u062a\u0648\u062c\u0647 \u0625\u0644\u0649 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629',
  },
  zh: {
    welcome: '\u6b22\u8fce\u4f7f\u7528 Idexal Agents',
    welcomeDesc: '\u60a8\u7684 AI \u5f00\u53d1\u52a9\u624b\u3002\u8ba9\u6211\u4eec\u5e2e\u52a9\u60a8\u5f00\u59cb\u3002',
    profile: '\u60a8\u7684\u8d44\u6599',
    profileDesc: '\u544a\u8bc9\u6211\u4eec\u4e00\u4e9b\u5173\u4e8e\u60a8\u7684\u4fe1\u606f\u3002',
    name: '\u59d3\u540d',
    namePlaceholder: '\u8f93\u5165\u60a8\u7684\u59d3\u540d',
    email: '\u7535\u5b50\u90ae\u4ef6',
    emailPlaceholder: 'your@email.com',
    role: '\u89d2\u8272',
    rolePlaceholder: '\u4f8b\u5982\u5f00\u53d1\u8005\u3001\u8bbe\u8ba1\u5e08',
    bio: '\u7b80\u4ecb',
    bioPlaceholder: '\u544a\u8bc9\u6211\u4eec\u5173\u4e8e\u60a8\u7684\u4fe1\u606f...',
    preferences: '\u504f\u597d\u8bbe\u7f6e',
    preferencesDesc: '\u81ea\u5b9a\u4e49\u60a8\u7684\u4f53\u9a8c\u3002',
    theme: '\u4e3b\u9898',
    themeLight: '\u6d45\u8272',
    themeDark: '\u6df1\u8272',
    themeSystem: '\u7cfb\u7edf',
    language: '\u8bed\u8a00',
    notifications: '\u542f\u7528\u901a\u77e5',
    notificationsDesc: '\u63a5\u6536\u66f4\u65b0\u901a\u77e5',
    compactMode: '\u7d27\u51d1\u6a21\u5f0f',
    compactModeDesc: '\u51cf\u5c11\u95f4\u8ddd',
    fontSize: '\u5b57\u4f53\u5927\u5c0f',
    fontSizeSmall: '\u5c0f',
    fontSizeMedium: '\u4e2d',
    fontSizeLarge: '\u5927',
    tutorial: '\u5feb\u901f\u5f15\u5bfc',
    tutorialDesc: '\u4e86\u89e3 Idexal Agents \u7684\u57fa\u672c\u529f\u80fd\u3002',
    tutorialChat: '\u5f00\u59cb\u5bf9\u8bdd',
    tutorialChatDesc: '\u8f93\u5165\u6d88\u606f\u5e76\u6309 Enter',
    tutorialSearch: '\u641c\u7d22\u5bf9\u8bdd',
    tutorialSearchDesc: '\u4f7f\u7528 Ctrl+K \u5feb\u901f\u67e5\u627e',
    tutorialExport: '\u5bfc\u51fa\u5bf9\u8bdd',
    tutorialExportDesc: '\u5c06\u5bf9\u8bdd\u4fdd\u5b58\u4e3a PDF',
    tutorialCollab: '\u56e2\u961f\u534f\u4f5c',
    tutorialCollabDesc: '\u5206\u4eab\u5bf9\u8bdd\u5e76\u534f\u540c\u5de5\u4f5c',
    complete: '\u51c6\u5907\u5b8c\u6210\uff01',
    completeDesc: '\u60a8\u7684\u8d26\u6237\u5df2\u5c31\u7eea\u3002\u5f00\u59cb\u63a2\u7d22 Idexal Agents\uff01',
    next: '\u4e0b\u4e00\u6b65',
    back: '\u4e0a\u4e00\u6b65',
    skip: '\u8df3\u8fc7',
    finish: '\u5f00\u59cb\u4f7f\u7528',
    startTour: '\u5f00\u59cb\u5f15\u5bfc',
    goToChat: '\u8fdb\u5165\u5bf9\u8bdd',
  },
}

/**
 * Onboarding Wizard Engine.
 */
export class OnboardingWizardEngine {
  private config: WizardConfig
  private state: WizardState
  private listeners: Set<(state: WizardState) => void> = new Set()

  constructor(config: Partial<WizardConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storageKey: config.storageKey ?? 'idexal-onboarding',
      autoShow: config.autoShow ?? true,
      allowSkip: config.allowSkip ?? true,
      onComplete: config.onComplete,
      onSkip: config.onSkip,
      onStepChange: config.onStepChange,
    }

    this.state = this.loadState()
  }

  /**
   * Get wizard state.
   */
  getState(): Readonly<WizardState> {
    return this.state
  }

  /**
   * Check if wizard should show.
   */
  shouldShow(): boolean {
    if (!this.config.enabled) return false
    if (this.state.isCompleted) return false
    if (this.state.isSkipped) return false
    return this.config.autoShow
  }

  /**
   * Start the wizard.
   */
  start(): void {
    this.state.startedAt = new Date()
    this.state.currentStepIndex = 0
    this.updateStepStatus(0, 'active')
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Go to next step.
   */
  next(): void {
    if (this.state.currentStepIndex < this.state.steps.length - 1) {
      this.updateStepStatus(this.state.currentStepIndex, 'completed')
      this.state.currentStepIndex++
      this.updateStepStatus(this.state.currentStepIndex, 'active')
      this.config.onStepChange?.(this.getCurrentStep()!)
      this.saveState()
      this.notifyListeners()
    }
  }

  /**
   * Go to previous step.
   */
  back(): void {
    if (this.state.currentStepIndex > 0) {
      this.updateStepStatus(this.state.currentStepIndex, 'pending')
      this.state.currentStepIndex--
      this.updateStepStatus(this.state.currentStepIndex, 'active')
      this.config.onStepChange?.(this.getCurrentStep()!)
      this.saveState()
      this.notifyListeners()
    }
  }

  /**
   * Skip current step.
   */
  skip(): void {
    if (!this.config.allowSkip) return

    const currentStep = this.getCurrentStep()
    if (currentStep) {
      this.updateStepStatus(this.state.currentStepIndex, 'skipped')
      this.config.onSkip?.(currentStep)
    }

    if (this.state.currentStepIndex < this.state.steps.length - 1) {
      this.state.currentStepIndex++
      this.updateStepStatus(this.state.currentStepIndex, 'active')
      this.config.onStepChange?.(this.getCurrentStep()!)
    } else {
      this.complete()
    }

    this.saveState()
    this.notifyListeners()
  }

  /**
   * Complete the wizard.
   */
  complete(): void {
    this.updateStepStatus(this.state.currentStepIndex, 'completed')
    this.state.isCompleted = true
    this.state.completedAt = new Date()

    this.config.onComplete?.({
      profile: this.state.profile,
      preferences: this.state.preferences,
      completedSteps: this.state.steps
        .filter(s => s.status === 'completed')
        .map(s => s.id),
      completedAt: this.state.completedAt,
    })

    this.saveState()
    this.notifyListeners()
  }

  /**
   * Skip entire wizard.
   */
  skipAll(): void {
    this.state.isSkipped = true
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Update profile data.
   */
  updateProfile(data: Partial<UserProfile>): void {
    this.state.profile = { ...this.state.profile, ...data }
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Update preferences.
   */
  updatePreferences(data: Partial<UserPreferences>): void {
    this.state.preferences = { ...this.state.preferences, ...data }
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Get current step.
   */
  getCurrentStep(): WizardStep | undefined {
    return this.state.steps[this.state.currentStepIndex]
  }

  /**
   * Get progress percentage.
   */
  getProgress(): number {
    const completed = this.state.steps.filter(s => s.status === 'completed').length
    return Math.round((completed / this.state.steps.length) * 100)
  }

  /**
   * Get translations for current language.
   */
  getTranslations(language: string): Record<string, string> {
    return WIZARD_TRANSLATIONS[language] ?? WIZARD_TRANSLATIONS.en ?? {}
  }

  /**
   * Reset wizard.
   */
  reset(): void {
    this.state = this.createInitialState()
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: WizardState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Destroy the engine.
   */
  destroy(): void {
    this.listeners.clear()
  }

  private createInitialState(): WizardState {
    return {
      steps: [
        { id: 'welcome', type: 'welcome', title: 'Welcome', description: '', status: 'pending', order: 0, isRequired: true, data: undefined },
        { id: 'profile', type: 'profile', title: 'Profile', description: '', status: 'pending', order: 1, isRequired: false, data: undefined },
        { id: 'preferences', type: 'preferences', title: 'Preferences', description: '', status: 'pending', order: 2, isRequired: false, data: undefined },
        { id: 'tutorial', type: 'tutorial', title: 'Tutorial', description: '', status: 'pending', order: 3, isRequired: false, data: undefined },
        { id: 'complete', type: 'complete', title: 'Complete', description: '', status: 'pending', order: 4, isRequired: true, data: undefined },
      ],
      currentStepIndex: 0,
      profile: { name: '', email: undefined, avatar: undefined, role: undefined, bio: undefined },
      preferences: { theme: 'system', language: 'en', notifications: true, compactMode: false, fontSize: 'medium' },
      isCompleted: false,
      isSkipped: false,
      startedAt: undefined,
      completedAt: undefined,
    }
  }

  private loadState(): WizardState {
    if (typeof window === 'undefined') return this.createInitialState()

    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...this.createInitialState(), ...parsed }
      }
    } catch {
      // Ignore parse errors
    }

    return this.createInitialState()
  }

  private saveState(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.state))
    } catch {
      // Ignore storage errors
    }
  }

  private updateStepStatus(index: number, status: StepStatus): void {
    const step = this.state.steps[index]
    if (step) {
      step.status = status
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Wizard listener error:', error)
      }
    }
  }
}

/**
 * Singleton instance.
 */
let instance: OnboardingWizardEngine | null = null

export function getOnboardingWizard(
  config?: Partial<WizardConfig>
): OnboardingWizardEngine {
  if (!instance) {
    instance = new OnboardingWizardEngine(config)
  }
  return instance
}

/**
 * Default user preferences.
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: true,
  compactMode: false,
  fontSize: 'medium',
}
