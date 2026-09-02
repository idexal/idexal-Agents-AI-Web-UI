/**
 * Drag and Drop hook for Idexal Agents Task Board.
 * Provides drag-and-drop functionality for reordering and changing task status.
 */

import { useState, useCallback, useEffect } from 'react'

export interface DragItem {
  id: string
  type: 'task'
  status?: string
}

export interface UseDragAndDropOptions {
  /** Callback when an item is dropped */
  onDrop?: (itemId: string, targetStatus: string, targetIndex: number) => void
  /** Callback when drag starts */
  onDragStart?: (item: DragItem) => void
  /** Callback when drag ends */
  onDragEnd?: () => void
  /** Enable/disable drag and drop */
  enabled?: boolean
}

export interface UseDragAndDropReturn {
  /** Whether an item is currently being dragged */
  isDragging: boolean
  /** The item currently being dragged */
  draggedItem: DragItem | null
  /** The current drop target status */
  dropTarget: string | null
  /** Get props for a draggable item */
  getDragProps: (item: DragItem) => {
    draggable: boolean
    onDragStart: (e: React.DragEvent) => void
    onDragEnd: (e: React.DragEvent) => void
    style: React.CSSProperties
    className: string
  }
  /** Get props for a drop target */
  getDropProps: (status: string) => {
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    className: string
  }
  /** Get props for a drop zone (for reordering) */
  getDropZoneProps: (status: string, index: number) => {
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    className: string
  }
  /** Whether the drop zone is active */
  isActiveDropZone: (status: string, index: number) => boolean
}

export function useDragAndDrop({
  onDrop,
  onDragStart,
  onDragEnd,
  enabled = true,
}: UseDragAndDropOptions = {}): UseDragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('dragging')
    }
  }, [])

  const handleDragStart = useCallback((item: DragItem, e: React.DragEvent) => {
    if (!enabled) return

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)

    // Create custom drag image
    const target = e.target as HTMLElement
    if (target) {
      const rect = target.getBoundingClientRect()
      e.dataTransfer.setDragImage(target, e.clientX - rect.left, e.clientY - rect.top)
    }

    setIsDragging(true)
    setDraggedItem(item)
    document.body.classList.add('dragging')

    onDragStart?.(item)
  }, [enabled, onDragStart])

  const handleDragEnd = useCallback((_e: React.DragEvent) => {
    setIsDragging(false)
    setDraggedItem(null)
    setDropTarget(null)
    setDropIndex(null)
    document.body.classList.remove('dragging')

    onDragEnd?.()
  }, [onDragEnd])

  const handleDragOver = useCallback((status: string, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(status)
  }, [])

  const handleDragLeave = useCallback((_status: string, e: React.DragEvent) => {
    // Only handle if leaving the drop target entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    if (currentTarget.contains(relatedTarget)) return

    setDropTarget(null)
    setDropIndex(null)
  }, [])

  const handleDrop = useCallback((status: string, index: number | null, e: React.DragEvent) => {
    e.preventDefault()

    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId && draggedItem) {
      onDrop?.(itemId, status, index ?? 0)
    }

    setIsDragging(false)
    setDraggedItem(null)
    setDropTarget(null)
    setDropIndex(null)
    document.body.classList.remove('dragging')
  }, [draggedItem, onDrop])

  const getDragProps = useCallback((item: DragItem) => ({
    draggable: enabled,
    onDragStart: (e: React.DragEvent) => handleDragStart(item, e),
    onDragEnd: handleDragEnd,
    style: {
      opacity: isDragging && draggedItem?.id === item.id ? 0.5 : 1,
      cursor: enabled ? 'grab' : 'default',
    } as React.CSSProperties,
    className: isDragging && draggedItem?.id === item.id ? 'dragging' : '',
  }), [enabled, isDragging, draggedItem, handleDragStart, handleDragEnd])

  const getDropProps = useCallback((status: string) => ({
    onDragOver: (e: React.DragEvent) => handleDragOver(status, e),
    onDragLeave: (e: React.DragEvent) => handleDragLeave(status, e),
    onDrop: (e: React.DragEvent) => handleDrop(status, null, e),
    className: dropTarget === status ? 'drop-target active' : 'drop-target',
  }), [dropTarget, handleDragOver, handleDragLeave, handleDrop])

  const getDropZoneProps = useCallback((status: string, index: number) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDropTarget(status)
      setDropIndex(index)
    },
    onDragLeave: (e: React.DragEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement
      const currentTarget = e.currentTarget as HTMLElement
      if (currentTarget.contains(relatedTarget)) return
      setDropIndex(null)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleDrop(status, index, e)
    },
    className: `drop-zone ${dropTarget === status && dropIndex === index ? 'active' : ''}`,
  }), [dropTarget, dropIndex, handleDrop])

  const isActiveDropZone = useCallback((status: string, index: number) => {
    return dropTarget === status && dropIndex === index
  }, [dropTarget, dropIndex])

  return {
    isDragging,
    draggedItem,
    dropTarget,
    getDragProps,
    getDropProps,
    getDropZoneProps,
    isActiveDropZone,
  }
}
