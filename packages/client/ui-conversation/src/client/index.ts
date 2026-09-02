/** Browser Conversation assemble core, React adapter, shell, and input plugin. */
export { apply, inject } from './apply.ts'
export { UiConversation } from './conversation/assembly.ts'
export type { ConversationBinding } from './conversation/assembly.ts'
export { ConversationController, UnsupportedImageMediaTypeError } from './service.ts'
export type { IConversation } from './service.ts'
export type {
  ConversationContextReader, ConversationLocation,
  ConversationLocationData, ConversationLocationDataScope, ConversationLocationDataStore,
  ConversationMatch, ConversationMatchResult, ConversationNodeContext,
  ConversationNodeDefinition, ConversationPreviousContext, ConversationPublication,
  ConversationStartMatch,
  ConversationStepDataMap, ConversationTimelineSnapshot, ConversationTurnDataMap,
  ConversationViewBuilder, ConversationViewDefinition, ConversationViewNode,
  ConversationViewSnapshotMap, ConversationViewSnapshotStore, StepLocation, TurnLocation,
} from './contract/conversation.ts'
export { EMPTY_CONVERSATION_SNAPSHOT, conversationPhase } from './contract/snapshot.ts'
export type {
  ConversationPhase, ConversationSnapshot,
} from './contract/snapshot.ts'
export type {
  AssistantBlock, AssistantMessageNode, AssistantProvenanceView, AssistantRequestConfig,
  AssistantTiming, CommandNode, CompactionSummaryNode, ContextMessageNode, ConversationNode,
  ModelRetryNode, PartialAssistant, RunningToolCall, SteeringMessageNode, TodoItem,
  ToolCallBlock, ToolResultNode, TurnErrorNode, TurnMaxTokensNode, UnknownSurfaceNode,
  UserMessageNode,
} from './contract/records.ts'
export type {
  ContextProvenanceView, ContextRole, KnownContextForm,
} from './contract/context-provenance.ts'
export type {
  ConversationPromptSnapshot, RequestInspectionSnapshot, RequestPromptChange, RequestPromptInspection, RequestPromptInspector, RequestView,
} from './contract/request-inspection.ts'
export { inspectRequestPrompt } from './contract/request-inspection.ts'
export type { ConversationStoreState, ConversationViewRequest, ViewTab } from './contract/views.ts'

export { ConversationNodeAssembler } from './conversation/assembler.ts'
export type {
  ConversationEventDefinitions, ConversationViewDefinitions,
} from './conversation/assembler.ts'
export { ConversationDefinitionRegistry } from './conversation/definition-registry.ts'
export { ConversationEventRegistry } from './conversation/event-registry.ts'
export { ConversationLocationIndex } from './conversation/location-index.ts'
export type { ConversationLocationDataChange } from './conversation/location-index.ts'
export { ConversationViewRegistry } from './conversation/view-registry.ts'

export type { ConversationKey } from './locales.ts'
export type {
  ComposerAttachment, ComposerAttachmentsOwnerProps, ComposerAttachmentsProps,
  ComposerBarInjected, ComposerBarOwnerProps, ComposerBarProps, ComposerChainProps,
  ConversationHeaderActionOwnerProps, ConversationHeaderLineageOwnerProps,
  ConversationInjected, ConversationSessionHeaderInjected, ConversationSessionHeaderSlotProps,
  ConversationSessionInjected, ConversationSessionSlotProps, ConversationSlotProps,
  ConversationStore, ConvViewOwnerProps, ConvViewProps, EmptyWorkspaceOwnerProps,
  HeroAgentPresetOwnerProps, HeroBrandMarkOwnerProps, InputControlOwnerProps, InputZone,
  MessageImageLoader, MessageImageSource, MessageImagesOwnerProps, RenderMessageImages, UseConversation,
  UseConversationViews,
} from './contract/slots.ts'
export type {
  ArbitrateKey, ArbitrateOutcome, BeginCommandRequest, CommandClaim, ConsumeTokenRequest,
  DraftAttachmentId, InputActions, InputState, InsertReferenceRequest, InsertTextRequest,
  PickOutcome, ReferenceInsert, SessionInput, SessionInputResolver, SubmitImageAttachment,
  SubmitOutcome, TokenSpan,
} from './contract/input.ts'
export type { ComposerBlock, ComposerBlocks } from './contract/composer-blocks.ts'

// Advanced Search exports
export { AdvancedSearchUI } from './AdvancedSearchUI.ts'
export {
  searchConversations,
  highlightMatches,
  generateSearchSuggestions,
  type SearchQuery,
  type SearchResult,
  type SearchStats,
} from './AdvancedSearch.ts'

// Task Board exports
export { TaskBoardUI } from './TaskBoardUI.tsx'
export type { TaskBoardProps } from './TaskBoardUI.tsx'
export {
  TaskBoard,
  getTaskBoard,
  formatTaskStatus,
  formatTaskPriority,
  getPriorityOrder,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type Subtask,
  type TaskStats,
} from './TaskBoard.ts'

// Drag & Drop Engine
export {
  DragDropEngine,
  getDragDropEngine,
  resetDragDropEngine,
  type DragState,
  type DragEventType,
  type DragEvent,
  type DragConfig,
  type DragStateChangeCallback,
  type DragEventCallback,
} from './DragDropEngine.ts'

// Task Collaboration
export { TaskCollaborationUI } from './TaskCollaborationUI.tsx'
export type { TaskCollaborationUIProps } from './TaskCollaborationUI.tsx'
export {
  TaskCollaborationEngine,
  getTaskCollaborationEngine,
  formatActivityAction,
  getActivityIcon,
  getNotificationIcon,
  formatRelativeTime,
  type TaskCollaborator,
  type TaskComment,
  type TaskReaction,
  type TaskActivity,
  type TaskAction,
  type TaskActionDetails,
  type TaskNotification,
  type NotificationType,
  type TaskCollabEventType,
  type TaskCollabEvent,
  type TaskCollabConfig,
  type TaskCollabState,
} from './TaskCollaboration.ts'

// Task Dependencies & Gantt Chart
export { GanttChart } from './GanttChart.tsx'
export type { GanttChartProps } from './GanttChart.tsx'
export {
  TaskDependenciesEngine,
  getTaskDependenciesEngine,
  formatGanttDate,
  getDateRange,
  generateDateTicks,
  calculateBarPosition,
  getDependencyArrowPath,
  getDefaultGanttConfig,
  type DependencyType,
  type TaskDependency,
  type TaskSchedule,
  type TaskMilestone,
  type CriticalPath,
  type GanttConfig,
  type GanttState,
  type GanttDragState,
  type GanttEventType,
  type GanttEvent,
  type TaskDependenciesConfig,
} from './TaskDependencies.ts'

// Micro-Interactions & Animations
export {
  MicroInteractionsEngine,
  getMicroInteractionsEngine,
  resetMicroInteractionsEngine,
  type AnimationPreset,
  type HoverEffect,
  type EasingFunction,
  type AnimationConfig,
  type HoverConfig,
  type InteractionEventType,
  type InteractionEvent,
  type MicroInteractionsConfig,
} from './MicroInteractions.ts'
export {
  Animated,
  RippleButton,
  Tooltip,
  Accordion,
  Toast,
  Spinner,
  ProgressBar,
  Badge,
  Skeleton,
  type AnimatedProps,
  type RippleButtonProps,
  type TooltipProps,
  type AccordionProps,
  type ToastProps,
  type SpinnerProps,
  type ProgressBarProps,
  type BadgeProps,
  type SkeletonProps,
} from './AnimatedComponents.tsx'

// Offline Mode exports (Advanced)
export { OfflineIndicator } from './OfflineIndicator.tsx'
export type { OfflineIndicatorProps } from './OfflineIndicator.tsx'
export {
  AdvancedOfflineStorage,
  getOfflineStorage,
  formatStorageSize,
  DEFAULT_OFFLINE_CONFIG,
  type OfflineStorageConfig,
  type StoredMessage,
  type StoredAttachment,
  type StoredConversation,
  type SyncStatus,
  type SyncQueueItem,
  type StorageStats,
  type ConflictResolution,
  type OfflineStorageEvent,
  type OfflineStorageEventType,
} from './OfflineStorageAdvanced.ts'
export {
  SyncManager,
  getSyncManager,
  formatSyncStatus,
  DEFAULT_SYNC_CONFIG,
  type SyncConfig,
  type SyncResult,
  type SyncProgress,
  type ConnectionStatus,
  type SyncState,
  type SyncEvent,
  type SyncEventType,
} from './SyncManager.ts'

// Real-time Sync (WebSocket)
export {
  RealtimeSyncEngine,
  getRealtimeSyncEngine,
  resetRealtimeSyncEngine,
  type RealtimeSyncConfig,
  type SyncMessage,
  type SyncMessageType,
  type SyncDevice,
  type DevicePresence,
  type Operation,
  type CausalOperation as RealtimeSyncCausalOperation,
  type SyncConflict as RealtimeSyncConflict,
  type SyncEngineEvent,
  type SyncEngineEventType,
  type SyncStats,
} from './RealtimeSync.ts'

// Export UI exports
export { ExportUI } from './ExportUI.tsx'
export {
  exportConversation,
  downloadFile,
  getMimeType,
  getFileExtension,
  type ExportOptions,
  type Conversation,
  type Message,
  type Attachment,
} from './ConversationExport.ts'

// Auto-Resume exports
export {
  AutoResumeManager,
  getAutoResumeManager,
  formatAgentStatus,
  getStatusColor,
  type Agent,
  type AgentStatus,
  type AutoResumeConfig,
  type AutoResumeState,
} from './AutoResume.ts'

// Advanced Auto-Resume System
export {
  AdvancedAutoResumeManager,
  getAdvancedAutoResumeManager,
  formatAgentStatus as formatAdvancedAgentStatus,
  getStatusColor as getAdvancedStatusColor,
  formatCircuitState,
  type Agent as AdvancedAgent,
  type AgentStatus as AdvancedAgentStatus,
  type RecoveryStrategy,
  type CircuitState,
  type AutoResumeConfig as AdvancedAutoResumeConfig,
  type AutoResumeState as AdvancedAutoResumeState,
  type AutoResumeMetrics,
  type RecoveryEvent,
} from './AutoResumeAdvanced.ts'

// Enhanced Auto-Resume System with Checkpoint Recovery
export {
  EnhancedAutoResumeManager,
  getEnhancedAutoResumeManager,
  formatAgentStatus as formatEnhancedAgentStatus,
  getStatusColor as getEnhancedStatusColor,
  formatCircuitState as formatEnhancedCircuitState,
  formatCheckpoint,
  type Agent as EnhancedAgent,
  type AgentStatus as EnhancedAgentStatus,
  type RecoveryStrategy as EnhancedRecoveryStrategy,
  type CircuitState as EnhancedCircuitState,
  type Checkpoint,
  type CheckpointMetadata,
  type AgentPerformance,
  type AutoResumeConfig as EnhancedAutoResumeConfig,
  type AutoResumeState as EnhancedAutoResumeState,
  type AutoResumeMetrics as EnhancedAutoResumeMetrics,
  type RecoveryEvent as EnhancedRecoveryEvent,
} from './AutoResumeEnhanced.ts'

// Fallback System exports
export {
  FallbackManager,
  getFallbackManager,
  formatProviderStatus,
  getProviderStatusColor,
  type Provider,
  type Model,
  type ProviderStatus,
  type FallbackConfig,
  type FallbackState,
} from './FallbackSystem.ts'

// Advanced Fallback System
export {
  AdvancedFallbackManager,
  getAdvancedFallbackManager,
  formatProviderStatus as formatAdvancedProviderStatus,
  getProviderStatusColor as getAdvancedProviderStatusColor,
  type Provider as AdvancedProvider,
  type Model as AdvancedModel,
  type ProviderStatus as AdvancedProviderStatus,
  type RoutingStrategy,
  type LoadBalancingStrategy,
  type ProviderFeatures,
  type ModelCapabilities,
  type FallbackConfig as AdvancedFallbackConfig,
  type FallbackState as AdvancedFallbackState,
  type FallbackMetrics,
  type RoutingRequest,
} from './FallbackSystemAdvanced.ts'

// Enhanced Fallback System with Cost Tracking
export {
  EnhancedFallbackManager,
  getEnhancedFallbackManager,
  formatProviderStatus as formatEnhancedProviderStatus,
  getProviderStatusColor as getEnhancedProviderStatusColor,
  formatCost,
  formatTokens,
  type Provider as EnhancedProvider,
  type Model as EnhancedModel,
  type ProviderStatus as EnhancedProviderStatus,
  type RoutingStrategy as EnhancedRoutingStrategy,
  type LoadBalancingStrategy as EnhancedLoadBalancingStrategy,
  type CircuitState as EnhancedFallbackCircuitState,
  type ProviderFeatures as EnhancedProviderFeatures,
  type ModelCapabilities as EnhancedModelCapabilities,
  type ProviderConfig,
  type PerformanceRecord,
  type ModelConfig,
  type ModelUsage,
  type FallbackConfig as EnhancedFallbackConfig,
  type FallbackState as EnhancedFallbackState,
  type FallbackMetrics as EnhancedFallbackMetrics,
  type CostReport,
  type QueuedRequest,
  type RoutingRequest as EnhancedRoutingRequest,
} from './FallbackSystemEnhanced.ts'

// Agent Status Dashboard
export { AgentStatusDashboard } from './AgentStatusDashboard.tsx'
export { EnhancedAgentStatusDashboard } from './EnhancedAgentStatusDashboard.tsx'

// Task Board Export
export { TaskBoardExportUI } from './TaskBoardExportUI.tsx'
export type { TaskBoardExportUIProps } from './TaskBoardExportUI.tsx'
export {
  exportTaskBoard,
  downloadTaskBoardExport,
  printAsPDF,
  filterTasks,
  calculateStats,
  generateHTML,
  generateCSV,
  generateJSON,
  DEFAULT_EXPORT_OPTIONS,
  type ExportFormat,
  type TaskBoardExportOptions,
  type TaskBoardExportResult,
} from './TaskBoardExport.ts'

// Real-time Search Index
export {
  RealtimeSearchIndex,
  getRealtimeSearchIndex,
  formatIndexStats,
  getIndexHealth,
  type MessageEvent,
  type MessageEventType,
  type IndexedMessage,
  type IndexedConversation,
  type RealtimeSearchConfig,
  type IndexStats,
  type SearchListener,
} from './RealtimeSearchIndex.ts'
export {
  useRealtimeSearch,
  useSearchSuggestions,
  type UseRealtimeSearchOptions,
  type UseRealtimeSearchReturn,
} from './useRealtimeSearch.ts'

// Search Highlight
export {
  SearchHighlight,
  SearchHighlightBlock,
  SearchMatchInfo,
  highlightText,
  type HighlightConfig,
  type HighlightResult,
  type SearchHighlightProps,
  type SearchHighlightBlockProps,
  type SearchMatchInfoProps,
} from './SearchHighlight.tsx'
export {
  useSearchNavigation,
  SearchMatchHighlight,
  type SearchNavigationState,
  type SearchNavigationActions,
  type UseSearchNavigationOptions,
  type UseSearchNavigationReturn,
  type SearchMatchHighlightProps,
} from './useSearchNavigation.tsx'

// Search Results Export
export { SearchExportUI } from './SearchExportUI.tsx'
export type { SearchExportUIProps } from './SearchExportUI.tsx'
export {
  exportSearchResults,
  downloadSearchExport,
  copySearchExportToClipboard,
  getExportPreview,
  generateSearchJSON,
  generateSearchCSV,
  generateSearchMarkdown,
  generateSearchHTML,
  DEFAULT_SEARCH_EXPORT_OPTIONS,
  type SearchExportFormat,
  type SearchExportOptions,
  type SearchExportResult,
} from './SearchResultsExport.ts'

// Conversation PDF Export
export { PDFExportUI } from './PDFExportUI.tsx'
export type { PDFExportUIProps } from './PDFExportUI.tsx'
export {
  exportConversationToPDF,
  downloadPDFExport,
  printPDFExport,
  copyPDFExportToClipboard,
  DEFAULT_PDF_OPTIONS,
  type PDFConversation,
  type PDFMessage,
  type PDFExportOptions,
  type PDFExportResult,
} from './ConversationPDFExport.ts'

// Batch Export
export { BatchExportUI } from './BatchExportUI.tsx'
export type { BatchExportUIProps } from './BatchExportUI.tsx'
export {
  batchExportConversations,
  downloadBatchExport,
  DEFAULT_BATCH_OPTIONS,
  type BatchConversation,
  type BatchExportFormat,
  type BatchExportOptions,
  type BatchExportResult,
  type BatchExportFile,
  type BatchExportProgress,
} from './BatchExport.ts'

// PDF Templates
export { PDFTemplateSelector } from './PDFTemplateSelector.tsx'
export type { PDFTemplateSelectorProps } from './PDFTemplateSelector.tsx'
export {
  PROFESSIONAL_TEMPLATE,
  MINIMAL_TEMPLATE,
  COLORFUL_TEMPLATE,
  ACADEMIC_TEMPLATE,
  BUILTIN_TEMPLATES,
  DEFAULT_TEMPLATE_VARIABLES,
  getTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  renderTemplate,
  type PDFTemplate,
  type TemplateVariable,
  type TemplatePresets,
} from './PDFTemplate.ts'

// Conversation Fork
export { ConversationForkUI } from './ConversationForkUI.tsx'
export type { ConversationForkUIProps } from './ConversationForkUI.tsx'
export {
  forkConversation,
  createForkVersion,
  compareConversations,
  getForkPointSuggestions,
  prepareMerge,
  getForkLabels,
  formatForkResult,
  DEFAULT_FORK_OPTIONS,
  type ForkableConversation,
  type ForkableMessage,
  type ForkedConversation,
  type ForkOptions,
  type ForkResult,
  type ForkHistoryEntry,
} from './ConversationFork.ts'

// Smart Suggestions
export { SmartSuggestionsUI } from './SmartSuggestionsUI.tsx'
export type { SmartSuggestionsUIProps } from './SmartSuggestionsUI.tsx'
export {
  SmartSuggestionsEngine,
  getSmartSuggestionsEngine,
  formatSuggestion,
  getSuggestionTypeColor,
  type SmartSuggestion,
  type SuggestionType,
  type SuggestionPriority,
  type SuggestionMetadata,
  type ConversationMessage,
  type UserPattern,
  type SmartSuggestionsConfig,
  type SmartSuggestionsState,
  type ConversationContext,
} from './SmartSuggestions.ts'

// Real-time Collaboration
export { TeamChat, PresenceIndicator, TypingIndicator, ReactionBar, ChannelList, MessageBubble } from './CollaborationUI.tsx'
export type {
  PresenceIndicatorProps,
  TypingIndicatorProps,
  ReactionBarProps,
  ChannelListProps,
  MessageBubbleProps,
  TeamChatProps,
} from './CollaborationUI.tsx'
export {
  RealtimeCollaborationEngine,
  getCollaborationEngine,
  QUICK_REACTIONS,
  formatMessageTime,
  formatPresenceStatus,
  getPresenceColor,
  type CollabUser,
  type Channel,
  type Message as CollabMessage,
  type Thread,
  type Reaction as CollabReaction,
  type Attachment as CollabAttachment,
  type CursorPosition,
  type PresenceStatus,
  type CollabEventType,
  type CollabEvent,
  type CollabConfig,
  type CollabState,
} from './RealtimeCollaboration.ts'

// Onboarding Wizard
export { OnboardingWizardUI } from './OnboardingWizardUI.tsx'
export type { OnboardingWizardUIProps } from './OnboardingWizardUI.tsx'
export {
  OnboardingWizardEngine,
  getOnboardingWizard,
  WIZARD_TRANSLATIONS,
  DEFAULT_PREFERENCES,
  type WizardStep,
  type StepType,
  type StepStatus,
  type UserProfile,
  type UserPreferences,
  type WizardConfig,
  type WizardData,
  type WizardState,
} from './OnboardingWizard.ts'

// Keyboard Shortcuts & Command Palette
export { CommandPalette } from './CommandPalette.tsx'
export type { CommandPaletteProps } from './CommandPalette.tsx'
export {
  KeyboardShortcutsEngine,
  getKeyboardShortcutsEngine,
  SHORTCUT_TRANSLATIONS,
  formatKey,
  type KeyboardShortcut,
  type Command,
  type ShortcutCategory,
  type CommandPaletteState,
  type Modifier,
  type KeyboardShortcutsConfig,
} from './KeyboardShortcuts.ts'

// Accessibility Engine & Panel
export { AccessibilityPanel } from './AccessibilityPanel.tsx'
export type { AccessibilityPanelProps } from './AccessibilityPanel.tsx'
export {
  AccessibilityEngine,
  getAccessibilityEngine,
  resetAccessibilityEngine,
  formatKeyCombo,
  DEFAULT_PREFERENCES as DEFAULT_A11Y_PREFERENCES,
  FOCUSABLE_SELECTOR,
  A11Y_TRANSLATIONS,
  type AccessibilityPreferences,
  type FocusTrapConfig,
  type KeyboardShortcutDef as A11yShortcutDef,
  type AnnounceMessage,
  type AccessibilityAuditResult,
  type ContrastLevel,
  type ScreenReaderMode,
  type FocusStrategy,
  type PreferenceCategory,
  type LiveRegionPoliteness,
  type LandmarkType,
  type WidgetRole,
  type AriaAttributes,
  type AccessibilityState,
} from './Accessibility.ts'

// Settings Export/Import
export { SettingsExportUI } from './SettingsExportUI.tsx'
export type { SettingsExportUIProps } from './SettingsExportUI.tsx'
export {
  exportSettings,
  importSettings,
  downloadSettings,
  readFileAsText,
  getSettingsSummary,
  getExportFilename,
  collectSettings,
  clearSettings,
  SETTINGS_EXPORT_VERSION,
  SETTINGS_EXPORT_TRANSLATIONS,
  type SettingsCategories,
  type SettingsExportMeta,
  type SettingsExportPayload,
  type SettingsImportResult,
  type SettingsExportResult,
  type SettingsExportLanguage,
} from './SettingsExport.ts'

// Smart Code Completion
export {
  SmartCodeCompletionEngine,
  getSmartCodeCompletionEngine,
  resetSmartCodeCompletionEngine,
  type CompletionSuggestion,
  type CompletionType,
  type CompletionPriority,
  type FileContext,
  type ProjectContext,
  type SmartCompletionConfig,
  type CompletionState,
  type CodeContextType,
} from './SmartCodeCompletion.ts'

// Code Quality Scoring
export {
  CodeQualityEngine,
  getCodeQualityEngine,
  resetCodeQualityEngine,
  type QualityScore,
  type QualityIssue,
  type QualityMetric,
  type QualityCategory,
  type IssueSeverity,
  type QualityAnalysisConfig,
} from './CodeQualityScoring.ts'

// Performance Dashboard
export {
  PerformanceDashboardEngine,
  getPerformanceDashboardEngine,
  resetPerformanceDashboardEngine,
  type PerformanceSnapshot,
  type FPSData,
  type MemoryData,
  type NetworkData,
  type RenderData,
  type PerformanceIssue,
  type PerformanceDashboardConfig,
} from './PerformanceDashboard.ts'

// Focus Mode
export {
  FocusModeEngine,
  getFocusModeEngine,
  resetFocusModeEngine,
  type FocusSession,
  type FocusConfig,
  type FocusModeState,
  type FocusState,
  type AmbientSound,
} from './FocusMode.ts'

// Auto-Generated Documentation
export {
  AutoDocumentationEngine,
  getAutoDocumentationEngine,
  resetAutoDocumentationEngine,
  type GeneratedDocumentation,
  type FunctionDoc as AutoFunctionDoc,
  type ClassDoc as AutoClassDoc,
  type ModuleDoc as AutoModuleDoc,
  type ParamDoc,
  type ReturnDoc,
  type DocSection as AutoDocSection,
  type DocType as AutoDocType,
  type DocLanguage as AutoDocLanguage,
  type AutoDocConfig,
} from './AutoDocumentation.ts'

// Predictive Bug Detection
export {
  PredictiveBugDetectionEngine,
  getPredictiveBugDetectionEngine,
  resetPredictiveBugDetectionEngine,
  type PredictedBug,
  type BugCategory,
  type BugSeverity,
  type BugPattern,
  type BugDetectionConfig,
} from './PredictiveBugDetection.ts'

// Security Vulnerability Scanner
export {
  SecurityScannerEngine,
  getSecurityScannerEngine,
  resetSecurityScannerEngine,
  type SecurityVulnerability,
  type SecurityScanResult,
  type VulnerabilityCategory,
  type VulnerabilitySeverity,
  type SecurityScannerConfig,
} from './SecurityScanner.ts'

// Intelligent Code Refactoring
export {
  IntelligentRefactoringEngine,
  getIntelligentRefactoringEngine,
  resetIntelligentRefactoringEngine,
  type RefactoringType,
  type RefactoringSeverity,
  type RefactoringSuggestion,
  type CodePattern,
  type RefactoringConfig,
} from './IntelligentRefactoring.ts'

// Smart Import Optimization
export {
  SmartImportEngine,
  getSmartImportEngine,
  resetSmartImportEngine,
  type ImportStatement,
  type ImportIssueType,
  type ImportIssueSeverity,
  type ImportOptimization,
  type ImportGroup,
  type SmartImportConfig,
  type BundleImpactAnalysis,
  type DependencyGraphNode,
  type DependencyGraph,
} from './SmartImportOptimization.ts'

// Code Metrics Dashboard
export {
  CodeMetricsEngine,
  getCodeMetricsEngine,
  resetCodeMetricsEngine,
  type MetricType,
  type MetricCategory,
  type CodeMetric,
  type FileMetrics,
  type ProjectMetrics,
  type ProjectMetricsSnapshot,
  type CodeRecommendation,
  type MetricsDashboardConfig,
  type TrendAnalysis,
  type TechnicalDebtItem,
  type TechnicalDebtReport,
} from './CodeMetricsDashboard.ts'

// Context-Aware Search
export {
  ContextAwareSearchEngine,
  getContextAwareSearchEngine,
  resetContextAwareSearchEngine,
  type SearchIntent,
  type CodeEntityType,
  type ContextSearchResult,
  type SearchContext,
  type CodeEntity,
  type SearchSuggestion,
  type ContextAwareSearchConfig,
} from './ContextAwareSearch.ts'

// Automated Test Generation
export {
  AutoTestEngine,
  getAutoTestEngine,
  resetAutoTestEngine,
  type TestType,
  type TestFramework,
  type GeneratedTest,
  type TestMock,
  type FunctionAnalysis,
  type AutoTestConfig,
} from './AutoTestGeneration.ts'

// Performance Prediction
export {
  PerformancePredictionEngine,
  getPerformancePredictionEngine,
  resetPerformancePredictionEngine,
  type PerformanceMetricType,
  type PerformanceIssueType,
  type PerformancePrediction,
  type CodeAnalysis,
  type PerformancePredictionConfig,
} from './PerformancePrediction.ts'

// Animated Transitions
export {
  AnimatedTransitionsEngine,
  getAnimatedTransitionsEngine,
  resetAnimatedTransitionsEngine,
  type AnimationType,
  type AnimationDirection,
  type AnimationKeyframe,
  type AnimatedTransitionConfig,
  type AnimationState,
  type TransitionGroup,
  type TransitionAnimationConfig,
  type AnimationEvent,
} from './AnimatedTransitions.ts'

// Custom Theme Builder
export {
  ThemeBuilderEngine,
  getThemeBuilderEngine,
  resetThemeBuilderEngine,
  type ColorFormat,
  type ThemeMode,
  type ColorToken,
  type ColorValue,
  type ThemeConfiguration,
  type ColorPalette,
  type ThemeBuilderConfig,
} from './CustomThemeBuilder.ts'

// Smart Caching System
export {
  SmartCacheEngine,
  getSmartCacheEngine,
  resetSmartCacheEngine,
  type CacheLevel,
  type CacheEntryStatus,
  type CacheEntry,
  type CacheStats,
  type PrefetchRule,
  type SmartCacheConfig,
  type CacheEvent,
} from './SmartCaching.ts'

// Intelligent Code Review
export {
  CodeReviewEngine,
  getCodeReviewEngine,
  resetCodeReviewEngine,
  type ReviewSeverity,
  type ReviewCategory as CoreReviewCategory,
  type ReviewIssue as CoreReviewIssue,
  type ReviewScore,
  type CodeReviewResult,
  type CodeReviewConfig,
  type ReviewRule as CoreReviewRule,
  type ReviewEvent,
} from './IntelligentCodeReview.ts'

// Smart Notifications
export {
  SmartNotificationEngine,
  getSmartNotificationEngine,
  resetSmartNotificationEngine,
  type NotificationType as SmartNotificationType,
  type NotificationPriority as SmartNotificationPriority,
  type NotificationPosition,
  type Notification,
  type NotificationGroup,
  type NotificationPreferences as SmartNotificationPreferences,
  type NotificationStats as SmartNotificationStats,
  type NotificationEvent,
} from './SmartNotifications.ts'

// AI Code Explanation
export {
  AICodeExplanationEngine,
  getAICodeExplanationEngine,
  resetAICodeExplanationEngine,
  type ExplanationLevel,
  type CodeEntityType as ExplanationEntityType,
  type ExplanationLanguage,
  type CodeExplanation,
  type ParamExplanation,
  type CodeExample,
  type ComplexityNotes,
  type ExplanationRequest,
  type AICodeExplanationConfig,
  type ExplanationEvent,
} from './AICodeExplanation.ts'

// Developer Dashboard UI
export { DeveloperDashboard } from './DeveloperDashboardUI.tsx'
export type { DashboardProps, DashboardTab, DashboardStats } from './DeveloperDashboardUI.tsx'

// Code Review UI
export { CodeReviewUI } from './CodeReviewUI.tsx'
export type { CodeReviewUIProps, ReviewIssue as UIReviewIssue, ReviewResult as UIReviewResult } from './CodeReviewUI.tsx'

// Notifications Center UI
export { NotificationsCenterUI } from './NotificationsCenterUI.tsx'
export type { NotificationsCenterProps, Notification as UINotification } from './NotificationsCenterUI.tsx'

// Dependency Graph
export {
  DependencyGraphEngine,
  getDependencyGraphEngine,
  resetDependencyGraphEngine,
  type GraphNodeType,
  type GraphEdgeType,
  type GraphNode,
  type GraphEdge,
  type DependencyCluster,
  type CircularChain,
  type GraphAnalysis,
  type DependencyGraphConfig,
  type GraphEvent,
} from './DependencyGraph.ts'

// Code Heatmap
export {
  CodeHeatmapEngine,
  getCodeHeatmapEngine,
  resetCodeHeatmapEngine,
  getHeatColorHex,
  type HeatmapMetric,
  type HeatColor as CodeHeatColor,
  type LineHeat,
  type BlockHeat,
  type HeatmapResult,
  type HeatmapConfig,
  type HeatmapEvent,
} from './CodeHeatmap.ts'

// Git Integration
export {
  GitIntegrationEngine,
  getGitIntegrationEngine,
  resetGitIntegrationEngine,
  type GitCommit,
  type GitFileChange,
  type GitBranch,
  type GitDiff,
  type GitDiffHunk,
  type GitBlameLine,
  type CommitSuggestion,
  type GitStatus,
  type GitAnalysis,
  type GitIntegrationConfig,
  type GitEvent,
} from './GitIntegration.ts'

// Smart Debugger
export {
  SmartDebuggerEngine,
  getSmartDebuggerEngine,
  resetSmartDebuggerEngine,
  type DebugSeverity,
  type DebugCategory,
  type BreakpointSuggestion,
  type DebugIssue,
  type RootCauseAnalysis,
  type DebugSessionConfig,
  type DebugSessionState,
  type StackFrame as DebuggerStackFrame,
  type SmartDebuggerConfig,
  type SmartDebuggerConfig as DebuggerConfig,
} from './SmartDebugger.ts'

// API Documentation Generator
export {
  DocGeneratorEngine,
  getDocGeneratorEngine,
  resetDocGeneratorEngine,
  type DocFormat as ApiDocFormat,
  type DocLanguage as ApiDocLanguage,
  type FunctionDoc as ApiFunctionDoc,
  type InterfaceDoc,
  type ClassDoc as ApiClassDoc,
  type ModuleDoc as ApiModuleDoc,
  type GeneratedDoc,
  type DocGeneratorConfig,
  type DocGeneratorEvent,
} from './DocGenerator.ts'

// Code Migration Assistant
export {
  CodeMigrationEngine,
  getCodeMigrationEngine,
  resetCodeMigrationEngine,
  type MigrationFramework,
  type MigrationType,
  type MigrationRule,
  type MigrationChange,
  type MigrationPlan,
  type CodeMigrationConfig,
  type MigrationEvent,
} from './CodeMigration.ts'

// Performance Profiler
export {
  PerformanceProfilerEngine,
  getPerformanceProfilerEngine,
  resetPerformanceProfilerEngine,
  type ProfilerMetric,
  type PerformanceSnapshot as ProfilerSnapshot,
  type PerformanceIssue as ProfilerIssue,
  type PerformanceReport,
  type PerformanceProfilerConfig,
  type ProfilerEvent,
} from './PerformanceProfiler.ts'

// Team Analytics
export {
  TeamAnalyticsEngine,
  getTeamAnalyticsEngine,
  resetTeamAnalyticsEngine,
  type AnalyticsPeriod,
  type AnalyticsMetricType as TeamAnalyticsMetricType,
  type DeveloperStats,
  type TeamMetric,
  type CodeHealth,
  type CollaborationPattern,
  type SprintReport,
  type TeamAnalyticsConfig,
  type AnalyticsEvent,
} from './TeamAnalytics.ts'

// Developer Analytics
export {
  DeveloperAnalyticsEngine,
  getDeveloperAnalyticsEngine,
  resetDeveloperAnalyticsEngine,
  type ActivityEvent,
  type ActivityType,
  type HourlyBucket,
  type DailySummary,
  type WeeklyTrend,
  type FlowSession,
  type FlowFactors,
  type CodingPattern,
  type LanguageStats,
  type DeveloperAnalyticsConfig,
  type AnalyticsEvent as DeveloperAnalyticsEvent,
} from './DeveloperAnalytics.ts'

// Code Translator
export {
  CodeTranslatorEngine,
  getCodeTranslatorEngine,
  resetCodeTranslatorEngine,
  type TranslationLanguage as CodeTranslatorLanguage,
  type TranslationQuality as CodeTranslatorQuality,
  type TranslationRequest as CodeTranslatorRequest,
  type TranslationResult as CodeTranslatorResult,
  type LanguageInfo,
  type CodeTranslatorConfig,
  type CodeTranslatorEvent,
} from './CodeTranslator.ts'

// Real-time Collaboration
export {
  CollaborationEngine,
  getCollaborationEngine as getRealtimeCollaborationEngine,
  resetCollaborationEngine,
  type ConnectionState,
  type PresenceStatus as RealtimePresenceStatus,
  type CursorPosition as RealtimeCursorPosition,
  type SelectionRange,
  type CollabUser as RealtimeCollabUser,
  type OperationType as CollabOperationType,
  type Operation as CollabOperation,
  type CollabDocument,
  type ConflictResolution as RealtimeConflictResolution,
  type CollabChatMessage,
  type CollaborationConfig,
  type CollabEvent as RealtimeCollabEvent,
} from './CollaborationEngine.ts'

// Plugin System
export {
  PluginSystemEngine,
  getPluginSystemEngine,
  resetPluginSystemEngine,
  type PluginState,
  type PluginMeta,
  type PluginPermission,
  type PluginContext,
  type PluginLifecycle,
  type Plugin,
  type PluginInstance,
  type PluginEvent,
  type PluginSystemConfig,
  type PluginSystemEvent,
} from './PluginSystem.ts'

// Review Chat
export {
  ReviewChatEngine,
  getReviewChatEngine,
  resetReviewChatEngine,
  type MessageRole,
  type MessageType,
  type ReviewContext,
  type ReviewMessage,
  type ReviewSuggestion,
  type ReviewThread,
  type ReviewSession,
  type ReviewChatConfig,
  type ReviewChatEvent,
} from './ReviewChat.ts'

// Refactoring Assistant
export {
  RefactoringAssistantEngine,
  getRefactoringAssistantEngine,
  resetRefactoringAssistantEngine,
  type RefactoringType as AssistantRefactoringType,
  type CodeSmellType,
  type RefactoringSuggestion as AssistantRefactoringSuggestion,
  type RefactoringResult,
  type RefactoringConfig as AssistantRefactoringConfig,
  type RefactoringEvent,
} from './RefactoringAssistant.ts'

// Snippet Manager
export {
  SnippetManagerEngine,
  getSnippetManagerEngine,
  resetSnippetManagerEngine,
  type SnippetLanguage as SnippetManagerLanguage,
  type SnippetCategory,
  type Snippet,
  type SnippetSearchQuery,
  type SnippetSearchResult as SnippetManagerSearchResult,
  type SnippetStatistics,
  type SnippetExportFormat,
  type SnippetManagerConfig,
  type SnippetManagerEvent,
} from './SnippetManager.ts'

// Project Templates
export {
  ProjectTemplatesEngine,
  getProjectTemplatesEngine,
  resetProjectTemplatesEngine,
  type TemplateFramework,
  type TemplateLanguage,
  type TemplateCategory,
  type TemplateFile,
  type TemplateDependency,
  type TemplateConfig,
  type ProjectRequest,
  type ProjectResult,
  type TemplateEvent,
} from './ProjectTemplates.ts'

// Code Generation
export {
  CodeGenerationEngine,
  getCodeGenerationEngine,
  resetCodeGenerationEngine,
  type GenerationLanguage,
  type GenerationStyle,
  type CodePatternType,
  type GenerationRequest,
  type GeneratedCode,
  type CodeTemplate,
  type CodeGenerationConfig,
  type CodeGenerationEvent,
} from './CodeGeneration.ts'

// Error Recovery
export {
  ErrorRecoveryEngine,
  getErrorRecoveryEngine,
  resetErrorRecoveryEngine,
  type ErrorSeverity as RecoveryErrorSeverity,
  type ErrorCategory as RecoveryErrorCategory,
  type RecoveryStrategy as ErrorRecoveryStrategy,
  type ErrorPattern,
  type ErrorAnalysis,
  type FixSuggestion as RecoveryFixSuggestion,
  type RecoveryResult,
  type ErrorRecoveryConfig,
  type ErrorRecoveryEvent,
} from './ErrorRecovery.ts'

// Pattern Library
export {
  PatternLibraryEngine,
  getPatternLibraryEngine,
  resetPatternLibraryEngine,
  type PatternType,
  type PatternCategory as PatternLibCategory,
  type DetectedPattern,
  type PatternDefinition,
  type PatternLibraryConfig,
  type PatternLibraryEvent,
} from './PatternLibrary.ts'

// Advanced Analytics
export {
  AdvancedAnalyticsEngine,
  getAdvancedAnalyticsEngine,
  resetAdvancedAnalyticsEngine,
  type AnalyticsPeriod as AdvancedAnalyticsPeriod,
  type MetricType as AnalyticsMetricType,
  type AnalyticsMetric,
  type QualityReport,
  type ProductivityReport,
  type ProjectHealth,
  type AdvancedAnalyticsConfig,
  type AnalyticsEngineEvent,
} from './AdvancedAnalytics.ts'

// Code Review Bot
export {
  CodeReviewBotEngine,
  getCodeReviewBotEngine,
  resetCodeReviewBotEngine,
  type ReviewCategory as BotReviewCategory,
  type IssueSeverity as BotIssueSeverity,
  type ReviewRule as BotReviewRule,
  type ReviewIssue as BotReviewIssueType,
  type ReviewResult as BotReviewResult,
  type CodeReviewBotConfig,
  type ReviewBotEvent,
} from './CodeReviewBot.ts'

// Testing Framework
export {
  TestingFrameworkEngine,
  getTestingFrameworkEngine,
  resetTestingFrameworkEngine,
  type TestType as FrameworkTestType,
  type TestFramework as FrameworkTestFramework,
  type TestStatus as FrameworkTestStatus,
  type TestCase as FrameworkTestCase,
  type TestSuite as FrameworkTestSuite,
  type TestGenRequest,
  type TestGenResult,
  type TestingFrameworkConfig,
  type TestingEvent,
} from './TestingFramework.ts'

// Migration Planner
export {
  MigrationPlannerEngine,
  getMigrationPlannerEngine,
  resetMigrationPlannerEngine,
  type MigrationType as PlannerMigrationType,
  type MigrationStatus,
  type RiskLevel,
  type MigrationStep,
  type MigrationPlan as PlannerMigrationPlan,
  type MigrationPlannerConfig,
  type MigrationPlannerEvent,
} from './MigrationPlanner.ts'

// Advanced Search Engine
export {
  AdvancedSearchEngine,
  getAdvancedSearchEngine,
  resetAdvancedSearchEngine,
  type SearchMode,
  type SearchScope,
  type SearchResult as EngineSearchResult,
  type SearchSuggestion as EngineSearchSuggestion,
  type SearchHistoryEntry,
  type AdvancedSearchConfig,
  type SearchEvent,
} from './AdvancedSearchEngine.ts'

// Doc Writer
export {
  DocWriterEngine,
  getDocWriterEngine,
  resetDocWriterEngine,
  type DocType as WriterDocType,
  type DocFormat as WriterDocFormat,
  type DocLanguage as WriterDocLanguage,
  type GeneratedDocument,
  type DocSection as WriterDocSection,
  type DocWriterConfig,
  type DocWriterEvent,
} from './DocWriter.ts'

// Dependency Manager
export {
  DependencyManagerEngine,
  getDependencyManagerEngine,
  resetDependencyManagerEngine,
  type DepType,
  type DepStatus,
  type Dependency,
  type Vulnerability,
  type DependencyReport,
  type DependencyRecommendation,
  type DependencyManagerConfig,
  type DependencyEvent,
} from './DependencyManager.ts'

// Code Formatter
export {
  CodeFormatterEngine,
  getCodeFormatterEngine,
  resetCodeFormatterEngine,
  type FormatLanguage,
  type FormatStyle,
  type FormatResult,
  type CodeFormatterConfig,
  type FormatterEvent,
} from './CodeFormatter.ts'

// Project Dashboard
export {
  ProjectDashboardEngine,
  getProjectDashboardEngine,
  resetProjectDashboardEngine,
  type WidgetType,
  type DashboardWidget,
  type ProjectMetrics as DashboardProjectMetrics,
  type ActivityEntry,
  type DashboardData,
  type ProjectDashboardConfig,
  type DashboardEvent,
} from './ProjectDashboard.ts'

// Quick Actions
export {
  QuickActionsEngine,
  getQuickActionsEngine,
  resetQuickActionsEngine,
  type ActionCategory,
  type ActionContext,
  type QuickAction,
  type KeyBinding,
  type CommandPaletteItem,
  type QuickActionsConfig,
  type QuickActionEvent,
} from './QuickActions.ts'

// Unified Dashboard UI
export { UnifiedDashboard } from './UnifiedDashboard.tsx'
export type { UnifiedDashboardProps, DashboardTab as UnifiedDashboardTab, DashboardStats as UnifiedDashboardStats } from './UnifiedDashboard.tsx'

// Code Review Bot UI
export { CodeReviewBotUI } from './CodeReviewBotUI.tsx'
export type { CodeReviewBotUIProps, ReviewIssue as BotReviewIssueUI, ReviewResult as BotReviewResultUI } from './CodeReviewBotUI.tsx'

// Command Palette UI
export { CommandPaletteUI } from './CommandPaletteUI.tsx'
export type { CommandPaletteUIProps, Command as PaletteCommand } from './CommandPaletteUI.tsx'

// Workflow Automation
export {
  WorkflowAutomationEngine,
  getWorkflowAutomationEngine,
  resetWorkflowAutomationEngine,
  type StepType as WorkflowStepType,
  type StepStatus as WorkflowStepStatus,
  type TriggerType,
  type WorkflowStep,
  type WorkflowTrigger,
  type WorkflowConfig,
  type Workflow,
  type WorkflowEvent,
} from './WorkflowAutomation.ts'

// Architecture Analyzer
export {
  ArchitectureAnalyzerEngine,
  getArchitectureAnalyzerEngine,
  resetArchitectureAnalyzerEngine,
  type ArchitecturePattern,
  type ViolationSeverity as ArchViolationSeverity,
  type LayerType,
  type ArchModule,
  type DependencyViolation,
  type ArchitectureReport,
  type ArchitectureConfig,
} from './ArchitectureAnalyzer.ts'

// Productivity Tracker
export {
  ProductivityTrackerEngine,
  getProductivityTrackerEngine,
  resetProductivityTrackerEngine,
  type ActivityType as ProductivityActivityType,
  type MetricTrend,
  type CodingSession,
  type DailyMetrics,
  type ProductivityReport as TrackerProductivityReport,
  type ProductivityConfig,
} from './ProductivityTracker.ts'

// Error Analytics
export {
  ErrorAnalyticsEngine,
  getErrorAnalyticsEngine,
  resetErrorAnalyticsEngine,
  type ErrorCategory as AnalyticsErrorCategory,
  type ErrorSeverity as AnalyticsErrorSeverity,
  type ErrorTrend,
  type CapturedError,
  type ErrorCluster,
  type ErrorAnalyticsReport,
  type ErrorAnalyticsConfig,
} from './ErrorAnalytics.ts'

// Smart Completion v2
export {
  SmartCompletionV2Engine,
  getSmartCompletionV2Engine,
  resetSmartCompletionV2Engine,
  type CompletionSource,
  type CompletionKind,
  type CompletionCandidate,
  type CompletionContext,
  type CompletionResult,
  type SmartCompletionV2Config,
} from './SmartCompletionV2.ts'

// Code Smell Detector
export {
  CodeSmellDetectorEngine,
  getCodeSmellDetectorEngine,
  resetCodeSmellDetectorEngine,
  type SmellType,
  type SmellSeverity,
  type CodeSmell,
  type SmellDetectionResult,
  type SmellDetectorConfig,
} from './CodeSmellDetector.ts'

// API Tester
export {
  APITesterEngine,
  getAPITesterEngine,
  resetAPITesterEngine,
  type HTTPMethod,
  type TestStatus as APITestStatus,
  type AssertionOp,
  type APIEndpoint,
  type TestCase as APITestCase,
  type Assertion,
  type TestSuite as APITestSuite,
  type TestReport,
  type APITesterConfig,
} from './APITester.ts'

// Log Analyzer
export {
  LogAnalyzerEngine,
  getLogAnalyzerEngine,
  resetLogAnalyzerEngine,
  type LogLevel,
  type LogPatternType,
  type LogEntry,
  type LogPattern,
  type LogAnalysisResult,
  type LogAnalyzerConfig,
} from './LogAnalyzer.ts'

// Complexity Heatmap
export {
  ComplexityHeatmapEngine,
  getComplexityHeatmapEngine,
  resetComplexityHeatmapEngine,
  type HeatColor,
  type LineHeatData,
  type BlockHeatData,
  type ComplexityHeatmapResult,
  type ComplexityHeatmapConfig,
} from './ComplexityHeatmap.ts'

// Notification Manager
export {
  SmartNotificationManagerEngine,
  getSmartNotificationManagerEngine,
  resetSmartNotificationManagerEngine,
  type NotificationChannel,
  type NotificationPriority,
  type NotificationCategory,
  type SmartNotification,
  type NotificationPreferences,
  type NotificationStats,
  type NotificationManagerConfig,
} from './NotificationManager.ts'

// Security Auditor
export {
  SecurityAuditorEngine,
  getSecurityAuditorEngine,
  resetSecurityAuditorEngine,
  type ThreatCategory,
  type ThreatSeverity as AuditorThreatSeverity,
  type OWASPCategory,
  type SecurityFinding,
  type SecurityAuditResult,
  type SecurityAuditorConfig,
} from './SecurityAuditor.ts'

// Schema Analyzer
export {
  SchemaAnalyzerEngine,
  getSchemaAnalyzerEngine,
  resetSchemaAnalyzerEngine,
  type ColumnType,
  type ConstraintType,
  type SchemaIssueType,
  type DBColumn,
  type DBIndex,
  type DBRelation,
  type DBTable,
  type SchemaIssue,
  type SchemaAnalysisResult,
  type SchemaAnalyzerConfig,
} from './SchemaAnalyzer.ts'

// Regression Detector
export {
  RegressionDetectorEngine,
  getRegressionDetectorEngine,
  resetRegressionDetectorEngine,
  type MetricUnit,
  type RegressionSeverity,
  type PerfSnapshot,
  type PerfMetric,
  type Regression,
  type RegressionReport,
  type RegressionDetectorConfig,
} from './RegressionDetector.ts'

// Vulnerability Scanner
export {
  VulnerabilityScannerEngine,
  getVulnerabilityScannerEngine,
  resetVulnerabilityScannerEngine,
  type VulnSeverity,
  type FixAvailable,
  type Dependency as VulnDependency,
  type Vulnerability as VulnVulnerability,
  type VulnScanResult,
  type VulnScannerConfig,
} from './VulnerabilityScanner.ts'

// Test Coverage Optimizer
export {
  TestCoverageOptimizerEngine,
  getTestCoverageOptimizerEngine,
  resetTestCoverageOptimizerEngine,
  type CoverageType,
  type TestPriority,
  type FunctionInfo,
  type FileCoverage,
  type TestSuggestion,
  type CoverageReport,
  type CoverageOptimizerConfig,
} from './TestCoverageOptimizer.ts'

// Accessible Themes Engine
export {
  AccessibleThemesEngine,
  getAccessibleThemesEngine,
  resetAccessibleThemesEngine,
  contrastRatio,
  type AccessibleThemeMode,
  type AccessibleThemeConfig,
  type AccessibleColorSet,
  type ContrastCheckResult,
  type ContrastRatio,
  type ColorBlindType,
  type ThemePreviewData,
} from './AccessibleThemes.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Scope-addressed Conversation actions and per-Session input registry. */
    conversation: import('./service.ts').IConversation
    /** Target-neutral Conversation registries and per-Session assembly. */
    uiConversation: import('./conversation/assembly.ts').UiConversation
  }
}
