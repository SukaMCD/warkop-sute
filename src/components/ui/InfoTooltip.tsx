import React, { useState, useRef, useEffect, useId } from 'react'
import { CircleHelp } from 'lucide-react'

export interface InfoTooltipProps {
  content: React.ReactNode
  title?: string
  placement?: 'top' | 'bottom'
  align?: 'center' | 'left' | 'right'
  size?: 'xs' | 'sm' | 'md'
  className?: string
  buttonClassName?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  placement = 'top',
  align = 'center',
  size = 'sm',
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  // Handle click outside to close on mobile/touch devices
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4'
  }

  // Positioning classes
  const placementClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2'
  }

  const alignClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-0 translate-x-0',
    right: 'right-0 translate-x-0'
  }

  // Arrow position
  const arrowPositionClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-3',
    right: 'right-3'
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle group ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="Info panduan"
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`p-0.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 cursor-help ${buttonClassName}`}
      >
        <CircleHelp className={`${iconSizes[size]} stroke-[2]`} />
      </button>

      {/* Tooltip Popup */}
      <div
        id={tooltipId}
        role="tooltip"
        className={`absolute z-50 pointer-events-none transition-all duration-150 ease-out w-64 sm:w-72 max-w-[85vw] ${
          placementClasses[placement]
        } ${alignClasses[align]} ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="relative bg-stone-900/95 dark:bg-stone-800/95 text-stone-200 dark:text-stone-100 text-xs rounded-xl p-3 shadow-xl backdrop-blur-xs border border-stone-800 dark:border-stone-700/80 leading-relaxed text-left font-sans normal-case tracking-normal">
          {title && (
            <p className="font-semibold text-stone-100 dark:text-amber-200/90 text-xs mb-1 font-mono tracking-tight flex items-center gap-1.5">
              <span>{title}</span>
            </p>
          )}
          <div className="text-stone-300 dark:text-stone-300 text-[11.5px] leading-relaxed">
            {content}
          </div>

          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-stone-900/95 dark:bg-stone-800/95 border-stone-800 dark:border-stone-700/80 rotate-45 ${
              placement === 'top'
                ? 'bottom-[-4px] border-b border-r'
                : 'top-[-4px] border-t border-l'
            } ${arrowPositionClasses[align]}`}
          />
        </div>
      </div>
    </div>
  )
}
