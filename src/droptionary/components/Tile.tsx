import { Component, Show } from 'solid-js'
import { Cell, LETTER_VALUES } from '../droptionary-game'

interface TileProps {
  cell: Cell
  onClick?: (c: Cell) => void
  onDrop?: (from: Cell, to: Cell) => void
  isSelected?: boolean
  isMatched?: boolean
}

const Tile: Component<TileProps> = (props) => {
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
      props.isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-blue-500/30 scale-105' : ''
    ]

    // Gradient background based on position and state
    if (props.isMatched) {
      baseClasses.push('bg-gradient-to-br from-green-500/90 to-emerald-600/90 text-white')
    } else {
      const isEvenRow = props.cell.row % 2 === 0
      const isEvenCol = props.cell.column % 2 === 0
      const isDark = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)
      
      if (isDark) {
        baseClasses.push('bg-gradient-to-br from-gray-700/80 to-gray-800/90')
      } else {
        baseClasses.push('bg-gradient-to-br from-gray-600/80 to-gray-700/90')
      }
    }

    // Hover and active states
    baseClasses.push(props.isMatched ? 'cursor-default' : 'cursor-pointer hover:brightness-110 active:brightness-95')

    return baseClasses.join(' ')
  }

  return (
    <div
      class={getTileClasses()}
      onClick={(e) => { e.stopPropagation(); props.onClick?.(props.cell) }}
      aria-label={`Tile ${props.cell.letter}`}
    >
      {/* Tile background */}
      <div class={`absolute inset-0 bg-gradient-to-br 
        rounded-md pointer-events-none transition-all duration-300
        ${props.isMatched ? 'from-green-500/20 to-emerald-600/20' : 'from-white/5 to-white/10'}`} />
      
      {/* Tile content */}
      <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <span class={`relative z-10 transition-all duration-200 ${props.isMatched ? 'scale-110 text-white' : 'text-gray-100'}`}>
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
    </div>
  )
}

// Export as default for compatibility
export default Tile