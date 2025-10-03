import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import type { Cell } from '../utils/game'

interface TileProps {
  cell: Cell
  onClick?: (c: Cell) => void
  onDrop?: (from: Cell, to: Cell) => void
  isSelected?: boolean
}

const Tile: Component<TileProps> = (props) => {
  let tileRef: HTMLDivElement | undefined
  
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
    baseClasses.push('cursor-pointer')
    
    if (props.isSelected) {
      baseClasses.push('cursor-grabbing')
    }
    
    // Hover effect for draggable tiles
    baseClasses.push('hover:brightness-110 transform hover:scale-105')

    // State-based styling
    if (props.isSelected) {
      baseClasses.push('z-20 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900')
      baseClasses.push('shadow-lg shadow-blue-500/30 scale-105')
    }

    return baseClasses.join(' ')
  }

  return (
    <div
      ref={tileRef}
      class={getTileClasses()}
      onClick={handleClick}
      aria-label={`Tile ${props.cell.letter}`}
    >
      {/* Inner highlight */}
      <div class="absolute inset-0 bg-white/5 rounded-md pointer-events-none" />
      
      {/* Letter */}
      <span class={`relative z-10 transition-transform duration-100`}>
        {props.cell.letter}
      </span>
    </div>
  )
}

export default Tile