import { Component, createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import type { Cell } from '../utils/game'

interface TileProps {
  cell: Cell
  onClick?: (c: Cell) => void
  onDrop?: (from: Cell, to: Cell) => void
  isSelected?: boolean
}

const Tile: Component<TileProps> = (props) => {
  let tileRef: HTMLDivElement | undefined
  const [isMatched, setIsMatched] = createSignal(false)
  const [isNew, setIsNew] = createSignal(true)
  const [isAnimating, setIsAnimating] = createSignal(false)
  
  let animationTimer: number | undefined
  
  // Cleanup on unmount
  onCleanup(() => {
    if (animationTimer) clearTimeout(animationTimer)
  })

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    // Don't allow clicking on matched tiles
    if (props.cell.isMatched) return
    
    if (props.onClick) {
      // Add a bounce effect on click
      if (tileRef) {
        tileRef.animate(
          [
            { transform: 'scale(0.9)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' }
          ],
          {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }
        )
      }
      props.onClick(props.cell)
    }
  }

  // Handle match animation
  createEffect(() => {
    if (props.cell.isMatched) {
      setIsMatched(true)
      setIsAnimating(true)
      
      // Add a pop animation when matched
      if (tileRef) {
        tileRef.animate(
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.2)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 }
          ],
          {
            duration: 300,
            easing: 'ease-out'
          }
        )
      }
      
      animationTimer = window.setTimeout(() => {
        setIsAnimating(false)
      }, 300)
      
      return () => {
        if (animationTimer) clearTimeout(animationTimer)
      }
    } else {
      setIsMatched(false)
    }
  })

  const getTileClasses = () => {
    const baseClasses = [
      'relative',
      'flex items-center justify-center',
      'w-full h-full',
      'select-none',
      'font-mono font-bold text-2xl',
      'transition-all duration-300 ease-out',
      'transform-gpu will-change-transform',
      'm-0 rounded-lg',
      'shadow-sm hover:shadow-md',
      'overflow-hidden',
      isNew() ? 'animate-float' : '',
      isAnimating() ? 'z-30' : 'z-0',
      props.cell.isMatched ? 'opacity-90' : 'opacity-100',
      props.isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-blue-500/30 scale-105' : ''
    ]

    // Gradient background based on position and state
    if (props.cell.isMatched) {
      baseClasses.push('bg-gradient-to-br from-green-500/90 to-emerald-600/90 text-white')
    } else {
      const isEvenRow = props.cell.r % 2 === 0
      const isEvenCol = props.cell.c % 2 === 0
      const isDark = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)
      
      if (isDark) {
        baseClasses.push('bg-gradient-to-br from-gray-700/80 to-gray-800/90')
      } else {
        baseClasses.push('bg-gradient-to-br from-gray-600/80 to-gray-700/90')
      }
    }

    // Hover and active states
    baseClasses.push(props.cell.isMatched ? 'cursor-default' : 'cursor-pointer hover:brightness-110 active:brightness-95')

    return baseClasses.join(' ')
  }

  return (
    <div
      ref={tileRef}
      class={getTileClasses()}
      onClick={handleClick}
      aria-label={`Tile ${props.cell.letter}`}
      style={{
        'animation-delay': `${(props.cell.r * 5 + props.cell.c) * 30}ms`,
        'view-transition-name': `tile-${props.cell.r}-${props.cell.c}`
      }}
    >
      {/* Tile background */}
      <div class={`absolute inset-0 bg-gradient-to-br 
        ${isMatched() ? 'from-green-500/20 to-emerald-600/20' : 'from-white/5 to-white/10'} 
        rounded-md pointer-events-none transition-all duration-300`} />
      
      {/* Tile content */}
      <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <span class={`relative z-10 transition-all duration-200 ${isMatched() ? 'scale-110 text-white' : 'text-gray-100'}`}>
          {props.cell.letter}
        </span>
        <Show when={LETTER_VALUES[props.cell.letter] > 1}>
          <span class="absolute bottom-0.5 right-1 text-[10px] font-bold text-white/60">
            {LETTER_VALUES[props.cell.letter]}
          </span>
        </Show>
      </div>

      {/* Selection indicator */}
      <Show when={props.isSelected}>
        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-lg animate-pulse"></div>
      </Show>

      {/* Animation for new tiles */}
      <Show when={isNew()}>
        <div class="absolute inset-0 bg-white/10 rounded-md animate-ping opacity-0"></div>
      </Show>
    </div>
  )
}

// Letter values for scoring display
const LETTER_VALUES: Record<string, number> = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
  'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
  'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
}

// Export as default for compatibility
export default Tile