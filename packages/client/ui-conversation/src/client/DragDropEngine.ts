/**
 * Drag & Drop Engine for Task Board.
 * Manages drag state, reorder logic, and drop zone detection.
 */

/** Drag state */
export interface DragState {
  /** ID of the task being dragged */
  draggedTaskId: string | null
  /** ID of the column the task was dragged from */
  sourceColumn: string | null
  /** ID of the column being hovered over */
  targetColumn: string | null
  /** Index of the drop position within the target column (-1 = end) */
  dropIndex: number
  /** Whether a drag operation is active */
  isDragging: boolean
  /** Current mouse position (for custom drag image) */
  mouseX: number
  mouseY: number
}

/** Drag event types */
export type DragEventType = 'dragStart' | 'dragOver' | 'dragLeave' | 'drop' | 'dragEnd'

/** Drag event data */
export interface DragEvent {
  type: DragEventType
  taskId: string
  sourceColumn?: string
  targetColumn?: string
  dropIndex?: number
  mouseX?: number
  mouseY?: number
}

/** Drag configuration */
export interface DragConfig {
  /** Enable smooth animations */
  animations?: boolean
  /** Enable touch support */
  touchSupport?: boolean
  /** Custom drag image dimensions */
  dragImageWidth?: number
  dragImageHeight?: number
  /** Distance threshold to start drag (touch) */
  touchThreshold?: number
}

/** Callback for drag state changes */
export type DragStateChangeCallback = (state: DragState) => void

/** Callback for drag events */
export type DragEventCallback = (event: DragEvent) => void

/**
 * DragDropEngine manages drag-and-drop state and logic.
 */
export class DragDropEngine {
  private state: DragState = {
    draggedTaskId: null,
    sourceColumn: null,
    targetColumn: null,
    dropIndex: -1,
    isDragging: false,
    mouseX: 0,
    mouseY: 0,
  }

  private config: DragConfig
  private stateListeners = new Set<DragStateChangeCallback>()
  private eventListeners = new Set<DragEventCallback>()
  private touchStartPos: { x: number; y: number } | null = null
  private touchTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config: DragConfig = {}) {
    this.config = {
      animations: true,
      touchSupport: true,
      dragImageWidth: 200,
      dragImageHeight: 60,
      touchThreshold: 10,
      ...config,
    }
  }

  /** Get current drag state */
  getState(): DragState {
    return { ...this.state }
  }

  /** Subscribe to state changes */
  onStateChange(callback: DragStateChangeCallback): () => void {
    this.stateListeners.add(callback)
    return () => { this.stateListeners.delete(callback) }
  }

  /** Subscribe to drag events */
  onDragEvent(callback: DragEventCallback): () => void {
    this.eventListeners.add(callback)
    return () => { this.eventListeners.delete(callback) }
  }

  /** Start a drag operation */
  startDrag(taskId: string, sourceColumn: string, event?: React.DragEvent): void {
    if (this.state.isDragging) return

    this.updateState({
      draggedTaskId: taskId,
      sourceColumn,
      isDragging: true,
      dropIndex: -1,
    })

    // Set drag data
    if (event) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', taskId)

      // Create custom drag image
      if (this.config.dragImageWidth && this.config.dragImageHeight) {
        const target = event.target as HTMLElement
        if (target) {
          event.dataTransfer.setDragImage(target, this.config.dragImageWidth / 2, this.config.dragImageHeight / 2)
        }
      }
    }

    this.emitEvent({ type: 'dragStart', taskId, sourceColumn })

    // Add body class for global drag styling
    if (typeof document !== 'undefined') {
      document.body.classList.add('is-dragging')
    }
  }

  /** Handle drag over a column */
  dragOver(columnId: string, mouseY: number, event?: React.DragEvent): void {
    if (!this.state.isDragging) return

    event?.preventDefault()

    // Calculate drop index based on mouse position
    const dropIndex = this.calculateDropIndex(columnId, mouseY)

    if (this.state.targetColumn !== columnId || this.state.dropIndex !== dropIndex) {
      this.updateState({
        targetColumn: columnId,
        dropIndex,
        mouseY,
      })
    }
  }

  /** Handle drag leaving a column */
  dragLeave(columnId: string): void {
    if (this.state.targetColumn === columnId) {
      this.updateState({
        targetColumn: null,
        dropIndex: -1,
      })
    }
  }

  /** Handle drop */
  drop(columnId: string, event?: React.DragEvent): { taskId: string; targetColumn: string; dropIndex: number } | null {
    if (!this.state.isDragging || !this.state.draggedTaskId) return null

    event?.preventDefault()

    const result = {
      taskId: this.state.draggedTaskId,
      targetColumn: columnId,
      dropIndex: this.state.dropIndex,
    }

    this.emitEvent({
      type: 'drop',
      taskId: result.taskId,
      sourceColumn: this.state.sourceColumn ?? undefined as unknown as string,
      targetColumn: columnId,
      dropIndex: this.state.dropIndex,
    })

    this.endDrag()

    return result
  }

  /** End the drag operation */
  endDrag(): void {
    if (!this.state.isDragging) return

    this.emitEvent({
      type: 'dragEnd',
      taskId: this.state.draggedTaskId ?? '',
      sourceColumn: this.state.sourceColumn ?? undefined as unknown as string,
    })

    this.updateState({
      draggedTaskId: null,
      sourceColumn: null,
      targetColumn: null,
      dropIndex: -1,
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
    })

    // Remove body class
    if (typeof document !== 'undefined') {
      document.body.classList.remove('is-dragging')
    }
  }

  /** Handle touch start for mobile drag */
  touchStart(taskId: string, columnId: string, event: React.TouchEvent): void {
    if (!this.config.touchSupport) return

    const touch = event.touches[0]
    if (!touch) return
    this.touchStartPos = { x: touch.clientX, y: touch.clientY }

    // Start drag after threshold
    this.touchTimer = setTimeout(() => {
      this.startDrag(taskId, columnId)
      this.updateState({ mouseX: touch.clientX, mouseY: touch.clientY })
    }, 200) // Long press to start drag
  }

  /** Handle touch move */
  touchMove(event: React.TouchEvent): void {
    if (!this.state.isDragging || !this.config.touchSupport) return

    const touch = event.touches[0]
    if (!touch) return

    // Cancel if moved too much before drag started
    if (!this.state.isDragging && this.touchStartPos) {
      const dx = touch.clientX - this.touchStartPos.x
      const dy = touch.clientY - this.touchStartPos.y
      if (Math.sqrt(dx * dx + dy * dy) > (this.config.touchThreshold ?? 10)) {
        this.cancelTouch()
        return
      }
    }

    event.preventDefault()

    this.updateState({
      mouseX: touch.clientX,
      mouseY: touch.clientY,
    })

    // Find element under touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const column = element?.closest('[data-column-id]') as HTMLElement | null
    if (column) {
      const columnId = column.dataset.columnId
      if (columnId) {
        this.dragOver(columnId, touch.clientY)
      }
    }
  }

  /** Handle touch end */
  touchEnd(): void {
    this.cancelTouch()

    if (this.state.isDragging && this.state.targetColumn) {
      this.drop(this.state.targetColumn)
    } else {
      this.endDrag()
    }
  }

  /** Cancel touch operation */
  private cancelTouch(): void {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer)
      this.touchTimer = null
    }
    this.touchStartPos = null
  }

  /** Calculate drop index based on mouse position */
  private calculateDropIndex(columnId: string, mouseY: number): number {
    if (typeof document === 'undefined') return -1

    const column = document.querySelector(`[data-column-id="${columnId}"] [data-tasks-container]`)
    if (!column) return -1

    const cards = Array.from(column.querySelectorAll('[data-task-card]'))

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement
      const rect = card.getBoundingClientRect()
      const midY = rect.top + rect.height / 2

      if (mouseY < midY) {
        return i
      }
    }

    return -1 // Drop at end
  }

  /** Update state and notify listeners */
  private updateState(partial: Partial<DragState>): void {
    this.state = { ...this.state, ...partial }
    for (const listener of this.stateListeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Drag state listener error:', error)
      }
    }
  }

  /** Emit a drag event */
  private emitEvent(event: DragEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Drag event listener error:', error)
      }
    }
  }

  /** Check if a task is being dragged */
  isTaskDragging(taskId: string): boolean {
    return this.state.isDragging && this.state.draggedTaskId === taskId
  }

  /** Check if a column is the drag target */
  isColumnTarget(columnId: string): boolean {
    return this.state.targetColumn === columnId
  }

  /** Check if a drop position is valid */
  isValidDropPosition(columnId: string, index: number): boolean {
    return this.state.isDragging && this.state.targetColumn === columnId && this.state.dropIndex === index
  }

  /** Get drop indicator style for a position */
  getDropIndicatorStyle(columnId: string, index: number): React.CSSProperties {
    if (!this.isValidDropPosition(columnId, index)) {
      return { display: 'none' }
    }
    return {
      position: 'absolute' as const,
      height: '3px',
      background: 'var(--color-primary, #3b82f6)',
      borderRadius: '2px',
      left: '8px',
      right: '8px',
      zIndex: 10,
    }
  }

  /** Get drag preview style */
  getDragPreviewStyle(): React.CSSProperties {
    if (!this.state.isDragging) {
      return { display: 'none' }
    }
    return {
      position: 'fixed' as const,
      left: this.state.mouseX - 100,
      top: this.state.mouseY - 25,
      width: 200,
      minHeight: 50,
      background: 'var(--bg-primary, #ffffff)',
      border: '2px solid var(--color-primary, #3b82f6)',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
      zIndex: 10000,
      pointerEvents: 'none' as const,
      opacity: 0.9,
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      fontSize: '14px',
      fontWeight: 500,
    }
  }

  /** Dispose of the engine */
  dispose(): void {
    this.stateListeners.clear()
    this.eventListeners.clear()
    this.cancelTouch()
    this.endDrag()
  }
}

/** Singleton instance */
let engineInstance: DragDropEngine | null = null

/** Get or create the singleton DragDropEngine */
export function getDragDropEngine(config?: DragConfig): DragDropEngine {
  if (!engineInstance) {
    engineInstance = new DragDropEngine(config)
  }
  return engineInstance
}

/** Reset the singleton (for testing) */
export function resetDragDropEngine(): void {
  engineInstance?.dispose()
  engineInstance = null
}

export default DragDropEngine
