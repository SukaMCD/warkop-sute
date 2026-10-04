import { useState, useRef, useEffect, useId } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

export interface SearchableOption {
  value: string
  label: string
  sublabel?: string
  badge?: string
  disabled?: boolean
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih salah satu...',
  searchPlaceholder = 'Cari...',
  disabled = false,
  className = '',
  id
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const generatedId = useId()
  const selectId = id || generatedId

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value)

  // Filtered Options
  const filteredOptions = options.filter((opt) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    const matchLabel = opt.label.toLowerCase().includes(q)
    const matchSub = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false
    const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false
    return matchLabel || matchSub || matchBadge
  })

  // Handle Outside Click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setHighlightedIndex(0)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 30)
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
        handleSelect(filteredOptions[highlightedIndex].value)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-xs ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-stone-950 border text-left transition-all cursor-pointer ${
          isOpen
            ? 'border-[#E2DFD2] ring-1 ring-[#E2DFD2]/20'
            : 'border-stone-800 hover:border-stone-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-stone-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-stone-500 font-mono truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
              {selectedOption.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-900 border border-stone-800 text-stone-400">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-stone-500">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-stone-200' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Input Box */}
          <div className="p-2 border-b border-stone-800 bg-stone-950/60 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-500 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setHighlightedIndex(0)
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-stone-100 placeholder-stone-500 focus:outline-none py-1 pr-2"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  searchInputRef.current?.focus()
                }}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin"
          >
            {filteredOptions.length === 0 ? (
              <li className="py-4 px-3 text-center text-[11px] text-stone-500 font-mono">
                Tidak ada pilihan yang cocok
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!opt.disabled) handleSelect(opt.value)
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      isSelected
                        ? 'bg-stone-800 text-[#E2DFD2] font-bold'
                        : isHighlighted
                        ? 'bg-stone-800/60 text-stone-100'
                        : 'text-stone-300 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] font-mono text-stone-500 font-normal truncate">
                          {opt.sublabel}
                        </span>
                      )}
                      {opt.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-950 border border-stone-800 text-stone-400 font-normal">
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#E2DFD2] shrink-0" />
                    )}
                  </li>
                )
              })
            )}
          </ul>

        </div>
      )}
    </div>
  )
}
