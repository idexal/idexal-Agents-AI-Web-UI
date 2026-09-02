/**
 * Collaboration UI Components for Idexal Agents Team Chat.
 * Provides presence indicators, typing indicators, reactions, channels, and threads.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCollaborationEngine,
  formatMessageTime,
  formatPresenceStatus,
  getPresenceColor,
  QUICK_REACTIONS,
  type CollabUser,
  type Channel,
  type Message,
  type Reaction,
} from './RealtimeCollaboration.ts'

/** Language type */
type Language = 'en' | 'ar' | 'zh'

/** Translations */
const T: Record<Language, Record<string, string>> = {
  en: {
    channels: 'Channels',
    newChannel: 'New Channel',
    directMessages: 'Direct Messages',
    members: 'Members',
    online: 'Online',
    offline: 'Offline',
    typing: 'typing...',
    typingMultiple: 'are typing...',
    sendMessage: 'Type a message...',
    send: 'Send',
    reply: 'Reply',
    thread: 'Thread',
    reactions: 'Reactions',
    mention: 'Mention',
    pin: 'Pin',
    unpin: 'Unpin',
    edit: 'Edit',
    delete: 'Delete',
    resolve: 'Resolve',
    unresolved: 'Unresolved',
    noMessages: 'No messages yet',
    startConversation: 'Start a conversation',
    searchChannels: 'Search channels...',
    searchMembers: 'Search members...',
    createChannel: 'Create Channel',
    channelName: 'Channel name',
    channelDescription: 'Description (optional)',
    public: 'Public',
    private: 'Private',
    cancel: 'Cancel',
    save: 'Save',
  },
  ar: {
    channels: '\u0627\u0644\u0642\u0646\u0627\u064a\u0627\u062a',
    newChannel: '\u0642\u0646\u0627\u064a\u0629 \u062c\u062f\u064a\u062f\u0629',
    directMessages: '\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629',
    members: '\u0627\u0644\u0623\u0639\u0636\u0627\u0621',
    online: '\u0645\u062a\u0635\u0644',
    offline: '\u063a\u064a\u0631 \u0645\u062a\u0635\u0644',
    typing: '\u064a\u0643\u062a\u0628...',
    typingMultiple: '\u064a\u0643\u062a\u0628\u0648\u0646...',
    sendMessage: '\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u062a\u0643...',
    send: '\u0625\u0631\u0633\u0627\u0644',
    reply: '\u0631\u062f',
    thread: '\u0645\u0633\u0627\u0631',
    reactions: '\u0627\u0644\u062a\u0641\u0627\u0639\u0644\u0627\u062a',
    mention: '\u0625\u0634\u0627\u0631\u0629',
    pin: '\u062a\u062b\u0628\u064a\u062a',
    unpin: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u062b\u0628\u064a\u062a',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    delete: '\u062d\u0630\u0641',
    resolve: '\u062d\u0644',
    unresolved: '\u063a\u064a\u0631 \u0645\u062d\u0644\u0648\u0644',
    noMessages: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0631\u0633\u0627\u0626\u0644',
    startConversation: '\u0628\u062f\u0623 \u0645\u062d\u0627\u062f\u062b\u0629',
    searchChannels: '\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0646\u0627\u064a\u0627\u062a...',
    searchMembers: '\u0628\u062d\u062b \u0639\u0646 \u0623\u0639\u0636\u0627\u0621...',
    createChannel: '\u0625\u0646\u0634\u0627\u0621 \u0642\u0646\u0627\u064a\u0629',
    channelName: '\u0627\u0633\u0645 \u0627\u0644\u0642\u0646\u0627\u064a\u0629',
    channelDescription: '\u0627\u0644\u0648\u0635\u0641 (\u0623\u062e\u062a\u064a\u0627\u0631\u064a)',
    public: '\u0639\u0627\u0645',
    private: '\u062e\u0627\u0635',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    save: '\u062d\u0641\u0638',
  },
  zh: {
    channels: '\u9891\u9053',
    newChannel: '\u65b0\u5efa\u9891\u9053',
    directMessages: '\u79c1\u4fe1',
    members: '\u6210\u5458',
    online: '\u5728\u7ebf',
    offline: '\u79bb\u7ebf',
    typing: '\u6b63\u5728\u8f93\u5165...',
    typingMultiple: '\u6b63\u5728\u8f93\u5165...',
    sendMessage: '\u8f93\u5165\u6d88\u606f...',
    send: '\u53d1\u9001',
    reply: '\u56de\u590d',
    thread: '\u4e32\u8054',
    reactions: '\u53cd\u5e94',
    mention: '\u63d0\u53ca',
    pin: '\u7f6e\u9876',
    unpin: '\u53d6\u6d88\u7f6e\u9876',
    edit: '\u7f16\u8f91',
    delete: '\u5220\u9664',
    resolve: '\u89e3\u51b3',
    unresolved: '\u672a\u89e3\u51b3',
    noMessages: '\u6682\u65e0\u6d88\u606f',
    startConversation: '\u5f00\u59cb\u5bf9\u8bdd',
    searchChannels: '\u641c\u7d22\u9891\u9053...',
    searchMembers: '\u641c\u7d22\u6210\u5458...',
    createChannel: '\u521b\u5efa\u9891\u9053',
    channelName: '\u9891\u9053\u540d\u79f0',
    channelDescription: '\u63cf\u8ff0\uff08\u53ef\u9009\uff09',
    public: '\u516c\u5f00',
    private: '\u79c1\u5bc6',
    cancel: '\u53d6\u6d88',
    save: '\u4fdd\u5b58',
  },
}

/** Presence Indicator Props */
export interface PresenceIndicatorProps {
  user: CollabUser
  language?: Language
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Presence Indicator Component.
 */
export function PresenceIndicator({
  user,
  language: _language = 'en',
  showName = true,
  size = 'md',
}: PresenceIndicatorProps) {
  const sizes = { sm: 8, md: 12, lg: 16 }
  const dotSize = sizes[size]

  return (
    <div className="presence-indicator" title={`${user.name} - ${formatPresenceStatus(user.status)}`}>
      <div className="avatar-wrapper" style={{ width: dotSize * 3, height: dotSize * 3 }}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="avatar" />
        ) : (
          <div className="avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className="status-dot"
          style={{
            width: dotSize,
            height: dotSize,
            background: getPresenceColor(user.status),
          }}
        />
      </div>
      {showName && <span className="user-name">{user.name}</span>}

      <style>{`
        .presence-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .avatar-wrapper {
          position: relative;
          border-radius: 50%;
          overflow: visible;
        }
        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }
        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          border-radius: 50%;
          border: 2px solid var(--bg-primary, #ffffff);
        }
        .user-name {
          font-size: 13px;
          color: var(--text-primary, #111827);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

/** Typing Indicator Props */
export interface TypingIndicatorProps {
  users: CollabUser[]
  language?: Language
}

/**
 * Typing Indicator Component.
 */
export function TypingIndicator({ users, language: _language = 'en' }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const t = T.en
  const names = users.map(u => u.name)
  let text: string

  if (names.length === 1) {
    text = `${names[0]} ${t.typing}`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} ${t.typingMultiple}`
  } else {
    text = `${names[0]} and ${names.length - 1} others ${t.typingMultiple}`
  }

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      <span className="typing-text">{text}</span>

      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }
        .typing-dots {
          display: flex;
          gap: 3px;
        }
        .typing-dots .dot {
          width: 6px;
          height: 6px;
          background: var(--text-secondary, #6b7280);
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        .typing-dots .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/** Reaction Bar Props */
export interface ReactionBarProps {
  reactions: Reaction[]
  currentUserId: string
  onAddReaction: (emoji: string) => void
  onRemoveReaction: (emoji: string) => void
  language?: Language
}

/**
 * Reaction Bar Component.
 */
export function ReactionBar({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  language: _language = 'en',
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="reaction-bar">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          className={`reaction-chip ${reaction.users.includes(currentUserId) ? 'active' : ''}`}
          onClick={() => {
            if (reaction.users.includes(currentUserId)) {
              onRemoveReaction(reaction.emoji)
            } else {
              onAddReaction(reaction.emoji)
            }
          }}
        >
          <span className="emoji">{reaction.emoji}</span>
          <span className="count">{reaction.users.length}</span>
        </button>
      ))}

      <div className="add-reaction-wrapper">
        <button className="add-reaction-btn" onClick={() => setShowPicker(!showPicker)}>
          +
        </button>
        {showPicker && (
          <div className="reaction-picker">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                className="reaction-option"
                onClick={() => {
                  onAddReaction(emoji)
                  setShowPicker(false)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .reaction-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }
        .reaction-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--bg-secondary, #f3f4f6);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 16px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }
        .reaction-chip:hover {
          background: var(--bg-hover, #e5e7eb);
        }
        .reaction-chip.active {
          background: #dbeafe;
          border-color: #3b82f6;
        }
        .reaction-chip .emoji {
          font-size: 14px;
        }
        .reaction-chip .count {
          color: var(--text-secondary, #6b7280);
        }
        .add-reaction-wrapper {
          position: relative;
        }
        .add-reaction-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #f3f4f6);
          border: 1px dashed var(--border-primary, #e5e7eb);
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }
        .add-reaction-btn:hover {
          background: var(--bg-hover, #e5e7eb);
          border-style: solid;
        }
        .reaction-picker {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          padding: 8px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          max-width: 200px;
          z-index: 100;
        }
        .reaction-option {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          transition: background 0.15s;
        }
        .reaction-option:hover {
          background: var(--bg-hover, #f3f4f6);
        }
      `}</style>
    </div>
  )
}

/** Channel List Props */
export interface ChannelListProps {
  channels: Channel[]
  activeChannel: string | undefined
  onSelectChannel: (channelId: string) => void
  onCreateChannel: () => void
  language?: Language
}

/**
 * Channel List Component.
 */
export function ChannelList({
  channels,
  activeChannel,
  onSelectChannel,
  onCreateChannel,
  language = 'en',
}: ChannelListProps) {
  const t = T[language] ?? T.en
  const [search, setSearch] = useState('')

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="channel-list">
      <div className="channel-header">
        <h3>{t.channels}</h3>
        <button className="create-btn" onClick={onCreateChannel}>+</button>
      </div>

      <input
        type="text"
        className="search-input"
        placeholder={t.searchChannels}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="channels">
        {filteredChannels.map((channel) => (
          <button
            key={channel.id}
            className={`channel-item ${activeChannel === channel.id ? 'active' : ''}`}
            onClick={() => onSelectChannel(channel.id)}
          >
            <span className="channel-icon">#</span>
            <span className="channel-name">{channel.name}</span>
            {channel.unreadCount > 0 && (
              <span className="unread-badge">{channel.unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        .channel-list {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary, #f9fafb);
          border-right: 1px solid var(--border-primary, #e5e7eb);
        }
        .channel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-primary, #e5e7eb);
        }
        .channel-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }
        .create-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .create-btn:hover {
          background: var(--color-primary-hover, #2563eb);
        }
        .search-input {
          margin: 8px 16px;
          padding: 8px 12px;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 6px;
          font-size: 13px;
          background: var(--bg-primary, #ffffff);
        }
        .channels {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .channel-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .channel-item:hover {
          background: var(--bg-hover, #f3f4f6);
        }
        .channel-item.active {
          background: var(--color-primary-light, #dbeafe);
        }
        .channel-icon {
          color: var(--text-secondary, #6b7280);
          font-weight: 600;
        }
        .channel-name {
          flex: 1;
          font-size: 13px;
          color: var(--text-primary, #111827);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .channel-item.active .channel-name {
          color: var(--color-primary, #3b82f6);
          font-weight: 500;
        }
        .unread-badge {
          padding: 2px 6px;
          background: var(--color-primary, #3b82f6);
          color: white;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}

/** Message Bubble Props */
export interface MessageBubbleProps {
  message: Message
  user: CollabUser | undefined
  currentUserId: string
  onReaction: (messageId: string, emoji: string, add: boolean) => void
  onReply: (messageId: string) => void
  onThread: (messageId: string) => void
  language?: Language
}

/**
 * Message Bubble Component.
 */
export function MessageBubble({
  message,
  user,
  currentUserId,
  onReaction,
  onReply,
  onThread,
  language = 'en',
}: MessageBubbleProps) {
  const t = T[language] ?? T.en
  const [showActions, setShowActions] = useState(false)

  if (message.isDeleted) {
    return (
      <div className="message-bubble deleted">
        <span className="deleted-text">{message.content}</span>
      </div>
    )
  }

  return (
    <div
      className="message-bubble"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-header">
        <PresenceIndicator user={user ?? { id: '', name: 'Unknown', avatar: undefined, status: 'offline', lastSeen: new Date(), cursor: undefined, isTyping: false, typingChannel: undefined, metadata: {} }} showName size="sm" />
        <span className="message-time">{formatMessageTime(message.timestamp)}</span>
        {message.editedAt && <span className="edited-badge">(edited)</span>}
      </div>

      <div className="message-content">{message.content}</div>

      {message.mentions.length > 0 && (
        <div className="mentions">
          {message.mentions.map((mention) => (
            <span key={mention} className="mention">@{mention}</span>
          ))}
        </div>
      )}

      {message.reactions.length > 0 && (
        <ReactionBar
          reactions={message.reactions}
          currentUserId={currentUserId}
          onAddReaction={(emoji) => onReaction(message.id, emoji, true)}
          onRemoveReaction={(emoji) => onReaction(message.id, emoji, false)}
          language={language}
        />
      )}

      {showActions && (
        <div className="message-actions">
          <button onClick={() => onReply(message.id)} title={t.reply}>R</button>
          <button onClick={() => onThread(message.id)} title={t.thread}>T</button>
          {message.reactions.length === 0 && (
            <button onClick={() => onReaction(message.id, '\u{1F44D}', true)} title={t.reactions}>+</button>
          )}
        </div>
      )}

      <style>{`
        .message-bubble {
          position: relative;
          padding: 12px 16px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .message-bubble:hover {
          background: var(--bg-hover, #f9fafb);
        }
        .message-bubble.deleted {
          opacity: 0.5;
          font-style: italic;
        }
        .message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .message-time {
          font-size: 11px;
          color: var(--text-secondary, #9ca3af);
        }
        .edited-badge {
          font-size: 11px;
          color: var(--text-secondary, #9ca3af);
        }
        .message-content {
          font-size: 14px;
          color: var(--text-primary, #111827);
          line-height: 1.5;
          word-break: break-word;
        }
        .deleted-text {
          color: var(--text-secondary, #6b7280);
          font-style: italic;
        }
        .mentions {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }
        .mention {
          padding: 2px 6px;
          background: #dbeafe;
          color: #2563eb;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .message-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .message-actions button {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }
        .message-actions button:hover {
          background: var(--bg-hover, #f3f4f6);
          color: var(--text-primary, #111827);
        }
      `}</style>
    </div>
  )
}

/** Team Chat Props */
export interface TeamChatProps {
  language?: Language
  userId?: string
  userName?: string
}

/**
 * Team Chat Component - Main collaboration interface.
 */
export function TeamChat({
  language = 'en',
  userId,
  userName,
}: TeamChatProps) {
  const t = T[language] ?? T.en
  const [engine] = useState(() => getCollaborationEngine({ userId: userId ?? '', userName: userName ?? '' }))
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | undefined>()
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<CollabUser[]>([])
  const [typingUsers, setTypingUsers] = useState<CollabUser[]>([])
  const [inputText, setInputText] = useState('')
  const [showCreateChannel, setShowCreateChannel] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubState = engine.onStateChange((state) => {
      setChannels(Array.from(state.channels.values()))
      setOnlineUsers(Array.from(state.onlineUsers.values()))

      if (state.activeChannel) {
        setMessages(engine.getMessages(state.activeChannel))
        setTypingUsers(engine.getTypingUsers(state.activeChannel))
      }
    })

    // Set initial state
    setChannels(engine.getUserChannels())
    const general = engine.getState().channels.get('general')
    if (general) {
      engine.joinChannel('general')
      setActiveChannel('general')
    }

    return () => {
      unsubState()
    }
  }, [engine])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || !activeChannel) return

    engine.sendMessage(activeChannel, inputText)
    setInputText('')
    engine.stopTyping()
  }, [engine, inputText, activeChannel])

  const handleTyping = useCallback(() => {
    if (activeChannel) {
      engine.startTyping(activeChannel)
    }
  }, [engine, activeChannel])

  const handleReaction = useCallback((messageId: string, emoji: string, add: boolean) => {
    if (!activeChannel) return
    if (add) {
      engine.addReaction(messageId, activeChannel, emoji)
    } else {
      engine.removeReaction(messageId, activeChannel, emoji)
    }
  }, [engine, activeChannel])

  const handleCreateChannel = useCallback((name: string, type: 'public' | 'private') => {
    engine.createChannel({ name, type })
    setShowCreateChannel(false)
  }, [engine])

  return (
    <div className="team-chat">
      {/* Sidebar */}
      <div className="sidebar">
        <ChannelList
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={(id) => {
            engine.joinChannel(id)
            setActiveChannel(id)
          }}
          onCreateChannel={() => setShowCreateChannel(true)}
          language={language}
        />

        {/* Online Users */}
        <div className="online-section">
          <h4>{t.online} ({onlineUsers.length})</h4>
          <div className="online-list">
            {onlineUsers.map((user) => (
              <PresenceIndicator key={user.id} user={user} language={language} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <h3># {channels.find(ch => ch.id === activeChannel)?.name ?? 'Select a channel'}</h3>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>{t.noMessages}</p>
              <p>{t.startConversation}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                user={engine.getState().onlineUsers.get(msg.userId) ?? engine.getState().currentUser}
                currentUserId={engine.getState().currentUser.id}
                onReaction={handleReaction}
                onReply={(id) => console.log('Reply to', id)}
                onThread={(id) => console.log('Thread', id)}
                language={language}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        <TypingIndicator users={typingUsers} language={language} />

        {/* Input */}
        <div className="message-input">
          <input
            type="text"
            placeholder={t.sendMessage}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            onInput={handleTyping}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
          >
            {t.send}
          </button>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
          language={language}
        />
      )}

      <style>{`
        .team-chat {
          display: flex;
          height: 100%;
          background: var(--bg-primary, #ffffff);
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
        }
        .sidebar {
          width: 260px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-primary, #e5e7eb);
        }
        .online-section {
          padding: 16px;
          border-top: 1px solid var(--border-primary, #e5e7eb);
        }
        .online-section h4 {
          margin: 0 0 12px 0;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
        }
        .online-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .chat-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-primary, #e5e7eb);
        }
        .chat-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary, #6b7280);
        }
        .empty-state p {
          margin: 4px 0;
        }
        .message-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid var(--border-primary, #e5e7eb);
        }
        .message-input input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .message-input input:focus {
          border-color: var(--color-primary, #3b82f6);
        }
        .send-btn {
          padding: 10px 20px;
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .send-btn:hover:not(:disabled) {
          background: var(--color-primary-hover, #2563eb);
        }
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

/** Create Channel Modal Props */
interface CreateChannelModalProps {
  onClose: () => void
  onCreate: (name: string, type: 'public' | 'private') => void
  language: Language
}

function CreateChannelModal({ onClose, onCreate, language }: CreateChannelModalProps) {
  const t = T[language] ?? T.en
  const [name, setName] = useState('')
  const [type, setType] = useState<'public' | 'private'>('public')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t.createChannel}</h3>
        <div className="form-group">
          <label>{t.channelName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="general"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>{t.channelDescription}</label>
          <input type="text" placeholder={t.channelDescription} />
        </div>
        <div className="form-group">
          <label>Type</label>
          <div className="type-options">
            <button
              className={`type-btn ${type === 'public' ? 'active' : ''}`}
              onClick={() => setType('public')}
            >
              {t.public}
            </button>
            <button
              className={`type-btn ${type === 'private' ? 'active' : ''}`}
              onClick={() => setType('private')}
            >
              {t.private}
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>{t.cancel}</button>
          <button
            className="save-btn"
            onClick={() => {
              if (name.trim()) {
                onCreate(name, type)
              }
            }}
            disabled={!name.trim()}
          >
            {t.save}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: var(--bg-primary, #ffffff);
          border-radius: 12px;
          padding: 24px;
          width: 400px;
          max-width: 90vw;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        }
        .modal h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: var(--text-primary, #111827);
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }
        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }
        .form-group input:focus {
          border-color: var(--color-primary, #3b82f6);
        }
        .type-options {
          display: flex;
          gap: 8px;
        }
        .type-btn {
          flex: 1;
          padding: 8px 16px;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 6px;
          background: var(--bg-primary, #ffffff);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s;
        }
        .type-btn.active {
          background: var(--color-primary, #3b82f6);
          border-color: var(--color-primary, #3b82f6);
          color: white;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 24px;
        }
        .cancel-btn {
          padding: 8px 16px;
          background: none;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }
        .save-btn {
          padding: 8px 16px;
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }
        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default TeamChat
