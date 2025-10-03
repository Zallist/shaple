import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import type { Cell } from '../utils/game'

interface TileProps {
  cell: Cell
  onClick?: (c: Cell) => void
  onDragStart?: (cell: Cell) => void
  onDragOver?: (cell: Cell) => void
  onDrop?: (from: Cell, to: Cell) => void
  isSelected?: boolean
  isMatched?: boolean
  isWord?: boolean
  isNew?: boolean
  isDraggable?: boolean
  isOver?: boolean
}

const Tile: Component<TileProps> = (props) => {
  let tileRef: HTMLDivElement | undefined
  let animationFrame: number | undefined = undefined
  const [isDragging, setIsDragging] = createSignal(false)
  const [isDragOver, setIsDragOver] = createSignal(false)
  
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (props.onClick) {
      // Add a subtle click effect
      if (tileRef) {
        tileRef.style.transform = 'scale(0.95)'
        setTimeout(() => {
          if (tileRef) tileRef.style.transform = ''
        }, 100)
      }
      props.onClick(props.cell)
    }
  }

  // Handle hover effects
  const handleMouseEnter = () => {
    if (!tileRef) return
    tileRef.style.transform = 'translateY(-2px)'
  }

  const handleMouseLeave = () => {
    if (!tileRef) return
    tileRef.style.transform = ''
  }

  // Animation for new tiles
  onMount(() => {
    if (props.isNew && tileRef) {
      tileRef.animate(
        [
          { transform: 'scale(0.8)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      )
    }
  })

  // Clean up animation frame on unmount
  onCleanup(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })

  // Handle matched state animation
  createEffect(() => {
    if (props.isMatched && tileRef) {
      const animation = tileRef.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.2)', opacity: 0.8 },
          { transform: 'scale(0)', opacity: 0 }
        ],
        { duration: 300, easing: 'ease-out' }
      )
      
      return () => {
        if (animation) animation.cancel()
      }
    }
  })

  const handleDragStart = (e: DragEvent) => {
    if (!props.isDraggable) return
    e.stopPropagation()
    setIsDragging(true)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(props.cell))
      e.dataTransfer.setDragImage(e.currentTarget as Element, 0, 0)
    }
    props.onDragStart?.(props.cell)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsDragOver(false)
  }

  const handleDragOver = (e: DragEvent) => {
    if (!props.isDraggable) return
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    if (!isDragOver()) {
      setIsDragOver(true)
      props.onDragOver?.(props.cell)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    try {
      const data = e.dataTransfer?.getData('text/plain')
      if (data) {
        const fromCell = JSON.parse(data) as Cell
        props.onDrop?.(fromCell, props.cell)
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  const getTileClasses = () => {
    const baseClasses = [
      'relative',
      'flex items-center justify-center',
      'w-full h-full', // Fixed size for all tiles
      'select-none',
      'font-mono font-bold text-2xl', // Added font-mono for Roboto Mono
      'transition-all duration-150 ease-out',
      'transform-gpu',
      'will-change-transform',
      'm-0', // Remove margin between tiles
    ]

    // Alternating pattern based on position
    const isEvenRow = props.cell.r % 2 === 0
    const isEvenCol = props.cell.c % 2 === 0
    const isDark = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)
    
    if (isDark) {
      baseClasses.push('bg-gray-800/60')
    } else {
      baseClasses.push('bg-gray-500/60')
    }

    // Cursor and interaction styles
    if (props.isDraggable) {
      baseClasses.push('cursor-pointer')
      
      if (props.isSelected || isDragging()) {
        baseClasses.push('cursor-grabbing')
      }
      
      // Hover effect for draggable tiles
      baseClasses.push('hover:brightness-110 transform hover:scale-105')
    }

    // State-based styling
    if (props.isSelected || isDragging()) {
      baseClasses.push('z-20 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900')
      baseClasses.push('shadow-lg shadow-blue-500/30 scale-105')
    } else if (isDragOver()) {
      baseClasses.push('bg-gray-600/50')
    }

    // Special states
    if (props.isWord) {
      baseClasses.push('bg-gradient-to-br from-green-600/90 to-emerald-600/90 text-white')
    } else if (props.isMatched) {
      baseClasses.push('bg-gradient-to-br from-yellow-500/90 to-amber-600/90 text-white')
    }

    return baseClasses.join(' ')
  }

  return (
    <div
      ref={tileRef}
      class={getTileClasses()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={props.isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`Tile ${props.cell.letter}`}
      style={{
        'transform': isDragging() ? 'scale(1.1) rotate(2deg)' : '',
        'transition': isDragging() ? 'none' : 'all 0.15s ease-out',
        'opacity': isDragging() ? '0.8' : '1',
      }}
    >
      {/* Inner highlight */}
      <div class="absolute inset-0 bg-white/5 rounded-md pointer-events-none" />
      
      {/* Letter */}
      <span class={`relative z-10 transition-transform duration-100 ${isDragging() ? 'scale-110' : ''}`}>
        {props.cell.letter}
      </span>
      
      {/* Word indicator dot */}
      {props.isWord && !isDragging() && (
        <div class="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
      )}
      
      {/* Drop indicator */}
      {isDragOver() && (
        <div class="absolute inset-0 border-2 border-dashed border-blue-400/70 rounded-md pointer-events-none" />
      )}
    </div>
  )
}

export default Tile