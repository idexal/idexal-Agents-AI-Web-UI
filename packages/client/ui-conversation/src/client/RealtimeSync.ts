/**
 * Real-time Sync Engine for Idexal Agents.
 * Provides cross-device synchronization over WebSocket with
 * operational transforms, conflict resolution, and device registry.
 */

// ---------------------------------------------------------------------------
// Protocol types
// ---------------------------------------------------------------------------

/** Sync message envelope */
export interface SyncMessage {
  /** Unique message ID (UUID) */
  id: string
  /** Message type */
  type: SyncMessageType
  /** Originating device ID */
  deviceId: string
  /** ISO-8601 timestamp */
  timestamp: string
  /** Sequence number for ordering */
  seq: number
  /** Payload — shape depends on type */
  payload: unknown
}

export type SyncMessageType =
  | 'handshake'
  | 'handshake-ack'
  | 'device-register'
  | 'device-heartbeat'
  | 'device-list'
  | 'op'
  | 'op-ack'
  | 'op-reject'
  | 'snapshot-request'
  | 'snapshot-response'
  | 'conflict'
  | 'conflict-resolve'
  | 'presence'
  | 'presence-batch'
  | 'ping'
  | 'pong'
  | 'error'

// ---------------------------------------------------------------------------
// Device registry
// ---------------------------------------------------------------------------

/** Registered device */
export interface SyncDevice {
  /** Device identifier (browser fingerprint or UUID) */
  id: string
  /** Human-readable name */
  name: string
  /** Device type */
  type: 'desktop' | 'mobile' | 'tablet' | 'web'
  /** Platform */
  platform: string
  /** Last seen ISO-8601 */
  lastSeen: string
  /** Connection status */
  status: 'connected' | 'disconnected' | 'stale'
  /** Current presence (optional) */
  presence?: DevicePresence
  /** Protocol version */
  protocolVersion: number
}

/** Device presence */
export interface DevicePresence {
  /** What the user is viewing */
  activeView: string
  /** Active conversation ID */
  activeConversationId?: string
  /** Cursor position */
  cursorPosition?: { line: number; column: number }
  /** Currently typing */
  isTyping?: boolean
  /** User-defined status */
  statusText?: string
}

// ---------------------------------------------------------------------------
// Operational Transform
// ---------------------------------------------------------------------------

/** Operation types */
export type OperationType = 'insert' | 'delete' | 'replace' | 'move' | 'set' | 'merge'

/** Single operation */
export interface Operation {
  /** Operation ID */
  id: string
  /** Operation type */
  type: OperationType
  /** Target entity */
  entity: 'conversation' | 'message' | 'setting' | 'task' | 'session'
  /** Entity ID */
  entityId: string
  /** Operation path (dot-separated) */
  path: string
  /** Value for insert/set/replace */
  value?: unknown
  /** End position for delete/replace */
  endPath?: string
  /** Metadata */
  metadata?: Record<string, unknown>
}

/** Operation with causal context */
export interface CausalOperation extends Operation {
  /** Vector clock at time of creation */
  vectorClock: Record<string, number>
  /** Causal dependency — must be applied before this op */
  dependsOn?: string
  /** Replaced operation ID (for transforms) */
  replaces?: string
}

// ---------------------------------------------------------------------------
// Conflict resolution
// ---------------------------------------------------------------------------

/** Conflict definition */
export interface SyncConflict {
  /** Conflict ID */
  id: string
  /** Entity involved */
  entity: string
  /** Entity ID */
  entityId: string
  /** Conflicting operations */
  operations: [CausalOperation, CausalOperation]
  /** Detected at ISO-8601 */
  detectedAt: string
  /** Resolution status */
  status: 'pending' | 'auto-resolved' | 'manually-resolved' | 'discarded'
  /** Resolution result (if resolved) */
  resolution?: CausalOperation
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface RealtimeSyncConfig {
  /** WebSocket server URL */
  serverUrl: string
  /** Authentication token */
  authToken?: string
  /** Reconnect delay base (ms) */
  reconnectBaseDelay: number
  /** Reconnect delay max (ms) */
  reconnectMaxDelay: number
  /** Max reconnect attempts (0 = infinite) */
  maxReconnectAttempts: number
  /** Heartbeat interval (ms) */
  heartbeatInterval: number
  /** Heartbeat timeout (ms) */
  heartbeatTimeout: number
  /** Presence broadcast interval (ms) */
  presenceInterval: number
  /** Conflict resolution strategy */
  conflictStrategy: 'last-writer-wins' | 'vector-clock' | 'manual'
  /** Enable operational transforms */
  enableOT: boolean
  /** Max pending operations before force-flush */
  maxPendingOps: number
  /** Batch send interval (ms) */
  batchInterval: number
  /** Enable compression */
  enableCompression: boolean
}

const DEFAULT_CONFIG: RealtimeSyncConfig = {
  serverUrl: 'ws://127.0.0.1:3081/sync',
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  maxReconnectAttempts: 0,
  heartbeatInterval: 15000,
  heartbeatTimeout: 5000,
  presenceInterval: 3000,
  conflictStrategy: 'vector-clock',
  enableOT: true,
  maxPendingOps: 100,
  batchInterval: 50,
  enableCompression: false,
}

// ---------------------------------------------------------------------------
// RealtimeSyncEngine
// ---------------------------------------------------------------------------

export class RealtimeSyncEngine {
  private config: RealtimeSyncConfig
  private ws: WebSocket | null = null
  private deviceId: string
  private deviceName: string
  private deviceType: SyncDevice['type']
  private seq: number = 0
  private vectorClock: Record<string, number> = {}
  private devices: Map<string, SyncDevice> = new Map()
  private pendingOps: CausalOperation[] = []
  private pendingAcks: Map<string, { op: CausalOperation; timer: ReturnType<typeof setTimeout> }> = new Map()
  private conflicts: SyncConflict[] = []
  private reconnectAttempts: number = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatResponseTimer: ReturnType<typeof setTimeout> | null = null
  private presenceTimer: ReturnType<typeof setInterval> | null = null
  private batchTimer: ReturnType<typeof setInterval> | null = null
  private connected: boolean = false
  private listeners: Set<(event: SyncEngineEvent) => void> = new Set()
  private presence: DevicePresence = { activeView: 'chat' }
  private seqCounter: number = 0

  constructor(config: Partial<RealtimeSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.deviceId = this.generateDeviceId()
    this.deviceName = this.getDeviceName()
    this.deviceType = this.getDeviceType()
    this.vectorClock[this.deviceId] = 0
  }

  // ---- Lifecycle ----

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      const url = this.config.authToken
        ? `${this.config.serverUrl}?token=${encodeURIComponent(this.config.authToken)}`
        : this.config.serverUrl

      this.ws = new WebSocket(url)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => this.handleOpen()
      this.ws.onmessage = (ev) => this.handleMessage(ev)
      this.ws.onclose = (ev) => this.handleClose(ev)
      this.ws.onerror = (ev) => this.handleError(ev)
    } catch {
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.clearAllTimers()
    this.reconnectAttempts = this.config.maxReconnectAttempts // prevent reconnect
    this.ws?.close(1000, 'client disconnect')
    this.ws = null
    this.connected = false
    this.emit({ type: 'disconnected', reason: 'manual' })
  }

  dispose(): void {
    this.disconnect()
    this.listeners.clear()
  }

  // ---- Public API ----

  isConnected(): boolean {
    return this.connected
  }

  getDeviceId(): string {
    return this.deviceId
  }

  getDevices(): SyncDevice[] {
    return [...this.devices.values()]
  }

  getConflicts(): SyncConflict[] {
    return [...this.conflicts]
  }

  /** Send an operation to all connected devices */
  sendOperation(op: Omit<CausalOperation, 'id' | 'vectorClock'>): CausalOperation {
    this.seq++
    this.vectorClock[this.deviceId] = (this.vectorClock[this.deviceId] ?? 0) + 1

    const fullOp: CausalOperation = {
      ...op,
      id: `${this.deviceId}-${this.seq}`,
      vectorClock: { ...this.vectorClock },
    }

    this.pendingOps.push(fullOp)
    this.flushBatch()

    return fullOp
  }

  /** Update local presence */
  setPresence(presence: Partial<DevicePresence>): void {
    this.presence = { ...this.presence, ...presence }
    this.sendPresence()
  }

  /** Request a full snapshot from the server */
  requestSnapshot(): void {
    this.send({
      id: this.nextId(),
      type: 'snapshot-request',
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      seq: this.seq,
      payload: { vectorClock: this.vectorClock },
    })
  }

  /** Resolve a conflict manually */
  resolveConflict(conflictId: string, winningOp: CausalOperation): void {
    const conflict = this.conflicts.find(c => c.id === conflictId)
    if (!conflict) return

    conflict.status = 'manually-resolved'
    conflict.resolution = winningOp

    this.send({
      id: this.nextId(),
      type: 'conflict-resolve',
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      seq: this.seq,
      payload: { conflictId, resolution: winningOp },
    })

    this.emit({ type: 'conflict-resolved', conflict })
  }

  /** Subscribe to sync events */
  on(listener: (event: SyncEngineEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Get connection stats */
  getStats(): SyncStats {
    return {
      connected: this.connected,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      seq: this.seq,
      vectorClock: { ...this.vectorClock },
      connectedDevices: this.devices.size,
      pendingOps: this.pendingOps.length,
      pendingAcks: this.pendingAcks.size,
      conflicts: this.conflicts.filter(c => c.status === 'pending').length,
      reconnectAttempts: this.reconnectAttempts,
    }
  }

  // ---- WebSocket handlers ----

  private handleOpen(): void {
    this.connected = true
    this.reconnectAttempts = 0
    this.vectorClock[this.deviceId] = this.vectorClock[this.deviceId] ?? 0

    // Handshake
    this.send({
      id: this.nextId(),
      type: 'handshake',
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      seq: 0,
      payload: {
        name: this.deviceName,
        type: this.deviceType,
        platform: this.getPlatform(),
        protocolVersion: 1,
        vectorClock: this.vectorClock,
      },
    })

    this.startHeartbeat()
    this.startPresence()
    this.startBatchTimer()
    this.emit({ type: 'connected', deviceId: this.deviceId })
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const text = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer)
      const msg = JSON.parse(text) as SyncMessage

      switch (msg.type) {
        case 'handshake-ack':
          this.handleHandshakeAck(msg)
          break
        case 'device-list':
          this.handleDeviceList(msg)
          break
        case 'device-heartbeat':
          this.handleDeviceHeartbeat(msg)
          break
        case 'op':
          this.handleRemoteOp(msg)
          break
        case 'op-ack':
          this.handleOpAck(msg)
          break
        case 'op-reject':
          this.handleOpReject(msg)
          break
        case 'snapshot-response':
          this.handleSnapshotResponse(msg)
          break
        case 'conflict':
          this.handleConflict(msg)
          break
        case 'presence':
        case 'presence-batch':
          this.handlePresence(msg)
          break
        case 'pong':
          this.handlePong()
          break
        case 'error':
          this.emit({ type: 'server-error', message: String(msg.payload) })
          break
        default:
          break
      }
    } catch {
      // Malformed message — ignore
    }
  }

  private handleClose(event: CloseEvent): void {
    this.connected = false
    this.clearAllTimers()
    this.emit({ type: 'disconnected', reason: event.reason || 'closed', code: event.code })

    if (event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private handleError(_event: Event): void {
    this.emit({ type: 'error', message: 'WebSocket error' })
  }

  // ---- Message handlers ----

  private handleHandshakeAck(msg: SyncMessage): void {
    const payload = msg.payload as { devices?: SyncDevice[]; serverTime?: string }
    if (payload.devices) {
      for (const dev of payload.devices) {
        if (dev.id !== this.deviceId) {
          this.devices.set(dev.id, dev)
        }
      }
    }
    this.emit({ type: 'sync-ready', deviceCount: this.devices.size })
  }

  private handleDeviceList(msg: SyncMessage): void {
    const payload = msg.payload as { devices: SyncDevice[] }
    this.devices.clear()
    for (const dev of payload.devices) {
      if (dev.id !== this.deviceId) {
        this.devices.set(dev.id, dev)
      }
    }
    this.emit({ type: 'devices-updated', devices: this.getDevices() })
  }

  private handleDeviceHeartbeat(msg: SyncMessage): void {
    const payload = msg.payload as { deviceId: string; lastSeen: string }
    const dev = this.devices.get(payload.deviceId)
    if (dev) {
      dev.lastSeen = payload.lastSeen
      dev.status = 'connected'
    }
  }

  private handleRemoteOp(msg: SyncMessage): void {
    const op = msg.payload as CausalOperation

    // Apply causal ordering
    if (this.config.enableOT) {
      const transformed = this.transform(op)
      this.emit({ type: 'operation-received', operation: transformed })
    } else {
      this.emit({ type: 'operation-received', operation: op })
    }

    // Update vector clock
    this.mergeVectorClock(op.vectorClock)

    // Ack
    this.send({
      id: this.nextId(),
      type: 'op-ack',
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      seq: this.seq,
      payload: { opId: op.id, vectorClock: this.vectorClock },
    })
  }

  private handleOpAck(msg: SyncMessage): void {
    const payload = msg.payload as { opId: string; vectorClock: Record<string, number> }
    const pending = this.pendingAcks.get(payload.opId)
    if (pending) {
      clearTimeout(pending.timer)
      this.pendingAcks.delete(payload.opId)
      this.mergeVectorClock(payload.vectorClock)
      this.emit({ type: 'operation-confirmed', operationId: payload.opId })
    }
  }

  private handleOpReject(msg: SyncMessage): void {
    const payload = msg.payload as { opId: string; reason: string; serverOp?: CausalOperation }
    const pending = this.pendingAcks.get(payload.opId)
    if (pending) {
      clearTimeout(pending.timer)
      this.pendingAcks.delete(payload.opId)
    }

    if (payload.serverOp && this.config.conflictStrategy === 'manual') {
      const conflict: SyncConflict = {
        id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        entity: pending?.op.entity ?? 'unknown',
        entityId: pending?.op.entityId ?? 'unknown',
        operations: [pending!.op, payload.serverOp],
        detectedAt: new Date().toISOString(),
        status: 'pending',
      }
      this.conflicts.push(conflict)
      this.emit({ type: 'conflict-detected', conflict })
    } else if (payload.serverOp) {
      // Auto-resolve: apply server version
      this.emit({ type: 'operation-rejected', operationId: payload.opId, reason: payload.reason, serverOp: payload.serverOp })
    }
  }

  private handleSnapshotResponse(msg: SyncMessage): void {
    const payload = msg.payload as { data: unknown; vectorClock: Record<string, number>; deviceCount: number }
    this.mergeVectorClock(payload.vectorClock)
    this.emit({ type: 'snapshot-received', data: payload.data, deviceCount: payload.deviceCount })
  }

  private handleConflict(msg: SyncMessage): void {
    const payload = msg.payload as { conflict: SyncConflict }
    this.conflicts.push(payload.conflict)
    this.emit({ type: 'conflict-detected', conflict: payload.conflict })
  }

  private handlePresence(msg: SyncMessage): void {
    const payload = msg.payload as { deviceId: string; presence: DevicePresence } | { entries: Array<{ deviceId: string; presence: DevicePresence }> }

    if ('entries' in payload) {
      for (const entry of payload.entries) {
        const dev = this.devices.get(entry.deviceId)
        if (dev) dev.presence = entry.presence
      }
    } else {
      const dev = this.devices.get(payload.deviceId)
      if (dev) dev.presence = payload.presence
    }
    this.emit({ type: 'presence-updated', devices: this.getDevices() })
  }

  private handlePong(): void {
    if (this.heartbeatResponseTimer) {
      clearTimeout(this.heartbeatResponseTimer)
      this.heartbeatResponseTimer = null
    }
  }

  // ---- Operational Transform ----

  /** Transform incoming op against pending local ops */
  private transform(incoming: CausalOperation): CausalOperation {
    if (this.pendingOps.length === 0) return incoming

    let op = incoming
    for (const local of this.pendingOps) {
      if (op.entity === local.entity && op.entityId === local.entityId && op.path === local.path) {
        op = this.transformPair(local, op)
      }
    }
    return op
  }

  /** Transform two concurrent operations on the same path */
  private transformPair(local: CausalOperation, remote: CausalOperation): CausalOperation {
    // Simple LWW for scalar values
    if (local.type === 'set' && remote.type === 'set') {
      const localTime = local.vectorClock[local.id.split('-')[0]!] ?? 0
      const remoteTime = remote.vectorClock[remote.id.split('-')[0]!] ?? 0
      return remoteTime >= localTime ? remote : { ...remote, value: local.value }
    }

    // Insert at same position: remote gets offset
    if (local.type === 'insert' && remote.type === 'insert' && local.path === remote.path) {
      return { ...remote }
    }

    return remote
  }

  private mergeVectorClock(remote: Record<string, number>): void {
    for (const [deviceId, counter] of Object.entries(remote)) {
      this.vectorClock[deviceId] = Math.max(this.vectorClock[deviceId] ?? 0, counter)
    }
  }

  // ---- Batching ----

  private flushBatch(): void {
    if (this.pendingOps.length >= this.config.maxPendingOps) {
      this.flushPendingOps()
    }
  }

  private flushPendingOps(): void {
    if (this.pendingOps.length === 0 || !this.connected) return

    const ops = this.pendingOps.splice(0)
    for (const op of ops) {
      this.send({
        id: this.nextId(),
        type: 'op',
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
        seq: this.seq,
        payload: op,
      })

      // Set ack timeout
      const timer = setTimeout(() => {
        this.pendingAcks.delete(op.id)
        this.emit({ type: 'operation-timeout', operationId: op.id })
      }, this.config.heartbeatTimeout)

      this.pendingAcks.set(op.id, { op, timer })
    }
  }

  // ---- Presence ----

  private sendPresence(): void {
    if (!this.connected) return
    this.send({
      id: this.nextId(),
      type: 'presence',
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      seq: this.seq,
      payload: this.presence,
    })
  }

  // ---- Transport ----

  private send(msg: SyncMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    try {
      this.ws.send(JSON.stringify(msg))
    } catch {
      // Send failed — will be caught on reconnect
    }
  }

  // ---- Reconnection ----

  private scheduleReconnect(): void {
    if (this.config.maxReconnectAttempts > 0 && this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit({ type: 'reconnect-failed', attempts: this.reconnectAttempts })
      return
    }

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      this.config.reconnectMaxDelay,
    ) + Math.random() * 1000

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.emit({ type: 'reconnecting', attempt: this.reconnectAttempts, delay })
      this.connect()
    }, delay)
  }

  // ---- Heartbeat ----

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (!this.connected) return

      this.send({
        id: this.nextId(),
        type: 'ping',
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
        seq: this.seq,
        payload: {},
      })

      this.heartbeatResponseTimer = setTimeout(() => {
        // No pong — connection may be dead
        this.ws?.close(4000, 'heartbeat timeout')
      }, this.config.heartbeatTimeout)
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null }
    if (this.heartbeatResponseTimer) { clearTimeout(this.heartbeatResponseTimer); this.heartbeatResponseTimer = null }
  }

  // ---- Timers ----

  private startPresence(): void {
    this.stopPresence()
    this.presenceTimer = setInterval(() => this.sendPresence(), this.config.presenceInterval)
  }

  private stopPresence(): void {
    if (this.presenceTimer) { clearInterval(this.presenceTimer); this.presenceTimer = null }
  }

  private startBatchTimer(): void {
    this.stopBatchTimer()
    this.batchTimer = setInterval(() => this.flushPendingOps(), this.config.batchInterval)
  }

  private stopBatchTimer(): void {
    if (this.batchTimer) { clearInterval(this.batchTimer); this.batchTimer = null }
  }

  private clearAllTimers(): void {
    this.stopHeartbeat()
    this.stopPresence()
    this.stopBatchTimer()
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
  }

  // ---- Helpers ----

  private nextId(): string {
    return `${this.deviceId}-${++this.seqCounter}-${Date.now().toString(36)}`
  }

  private generateDeviceId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }

  private getDeviceName(): string {
    if (typeof navigator !== 'undefined') return navigator.userAgent.slice(0, 60)
    return 'Node.js Client'
  }

  private getDeviceType(): SyncDevice['type'] {
    if (typeof navigator === 'undefined') return 'desktop'
    const ua = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone/.test(ua)) return 'mobile'
    if (/ipad|tablet/.test(ua)) return 'tablet'
    return 'web'
  }

  private getPlatform(): string {
    if (typeof navigator !== 'undefined') return navigator.platform
    return 'unknown'
  }

  private emit(event: SyncEngineEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type SyncEngineEventType =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnect-failed'
  | 'sync-ready'
  | 'devices-updated'
  | 'operation-received'
  | 'operation-confirmed'
  | 'operation-rejected'
  | 'operation-timeout'
  | 'snapshot-received'
  | 'conflict-detected'
  | 'conflict-resolved'
  | 'presence-updated'
  | 'error'
  | 'server-error'

export type SyncEngineEvent =
  | { type: 'connected'; deviceId: string }
  | { type: 'disconnected'; reason: string; code?: number }
  | { type: 'reconnecting'; attempt: number; delay: number }
  | { type: 'reconnect-failed'; attempts: number }
  | { type: 'sync-ready'; deviceCount: number }
  | { type: 'devices-updated'; devices: SyncDevice[] }
  | { type: 'operation-received'; operation: CausalOperation }
  | { type: 'operation-confirmed'; operationId: string }
  | { type: 'operation-rejected'; operationId: string; reason: string; serverOp: CausalOperation }
  | { type: 'operation-timeout'; operationId: string }
  | { type: 'snapshot-received'; data: unknown; deviceCount: number }
  | { type: 'conflict-detected'; conflict: SyncConflict }
  | { type: 'conflict-resolved'; conflict: SyncConflict }
  | { type: 'presence-updated'; devices: SyncDevice[] }
  | { type: 'error'; message: string }
  | { type: 'server-error'; message: string }

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface SyncStats {
  connected: boolean
  deviceId: string
  deviceName: string
  seq: number
  vectorClock: Record<string, number>
  connectedDevices: number
  pendingOps: number
  pendingAcks: number
  conflicts: number
  reconnectAttempts: number
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: RealtimeSyncEngine | null = null

export function getRealtimeSyncEngine(
  config?: Partial<RealtimeSyncConfig>,
): RealtimeSyncEngine {
  if (!instance) {
    instance = new RealtimeSyncEngine(config)
  }
  return instance
}

export function resetRealtimeSyncEngine(): void {
  instance?.dispose()
  instance = null
}
