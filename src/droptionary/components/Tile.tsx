import { Component, Match, Show, Switch } from 'solid-js'
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
      'text-2xl',
      'transition-all duration-300 ease-out',
      'm-0 rounded-lg',
      'overflow-hidden',
      'ring-offset-gray-900',
      !props.isSelected ? 'ring-1 ring-blue-400/50 ring-offset-1' : '',
      props.isSelected ? 'ring-2 ring-blue-400 ring-offset-2 scale-105' : ''
    ]

    // Gradient background based on position and state
    if (props.isMatched) {
      baseClasses.push('bg-gradient-to-br from-green-500/90 to-emerald-600/90 text-white')
    } 
    else {
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
      <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <Show when={props.cell.modifier !== 'none'}>
          <div class={`absolute inset-0 pointer-events-none bg-radial via-40%
            ${props.cell.modifier === '2x word' &&    'from-purple-500/0 via-purple-500/10 to-purple-600/50'}
            ${props.cell.modifier === '3x word' &&    'from-purple-500/0 via-purple-500/10 to-purple-600/60'}
            ${props.cell.modifier === '4x word' &&    'from-purple-500/0 via-purple-500/10 to-purple-600/70'}
            ${props.cell.modifier === '5x word' &&    'from-purple-500/0 via-purple-500/10 to-pink-600/80'}
            ${props.cell.modifier === '2x letter' &&  'from-green-500/0 via-green-500/10 to-green-600/50'}
            ${props.cell.modifier === '3x letter' &&  'from-green-500/0 via-green-500/10 to-green-600/60'}
            ${props.cell.modifier === '4x letter' &&  'from-green-500/0 via-green-500/10 to-green-600/70'}
            ${props.cell.modifier === '5x letter' &&  'from-green-500/0 via-green-500/10 to-emerald-600/80'}
            ${props.cell.modifier === '+1' &&         'from-blue-500/0 via-blue-500/10 to-blue-600/50'}
            ${props.cell.modifier === '+2' &&         'from-blue-500/0 via-blue-500/10 to-blue-600/60'}
            ${props.cell.modifier === '+5' &&         'from-blue-500/0 via-blue-500/10 to-blue-600/70'}
            ${props.cell.modifier === '+10' &&        'from-blue-500/0 via-blue-500/10 to-indigo-600/80'}`}
            ></div>

          {/* Full modifier text label */}
          <span class="absolute top-0.5 left-1 right-1 text-right text-[8px] font-bold text-white/60 leading-none">
            {props.cell.modifier === '5x word' &&     '5x word'}
            {props.cell.modifier === '4x word' &&     '4x word'}
            {props.cell.modifier === '3x word' &&     '3x word'}
            {props.cell.modifier === '2x word' &&     '2x word'}
            {props.cell.modifier === '5x letter' &&   '5x'}
            {props.cell.modifier === '4x letter' &&   '4x'}
            {props.cell.modifier === '3x letter' &&   '3x'}
            {props.cell.modifier === '2x letter' &&   '2x'}
            {props.cell.modifier === '+1' &&          '+1'}
            {props.cell.modifier === '+2' &&          '+2'}
            {props.cell.modifier === '+5' &&          '+5'}
            {props.cell.modifier === '+10' &&         '+10'}
          </span>
        </Show>

        <Show when={LETTER_VALUES[props.cell.letter] > 1}>
          <span class="absolute bottom-0.5 right-1 text-[10px] font-bold text-white/60">
            {LETTER_VALUES[props.cell.letter]}
          </span>
        </Show>

        <span class={`relative z-10 transition-all duration-200 ${props.isMatched ? 'scale-110 text-white' : 'text-gray-100'}`}>
          {props.cell.letter}
        </span>
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