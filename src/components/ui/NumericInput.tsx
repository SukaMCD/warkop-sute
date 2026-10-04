import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface NumericInputProps {
  value: number | ''
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
  allowDecimals?: boolean
  showStepper?: boolean
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1000,
  prefix,
  suffix,
  placeholder = '0',
  required = false,
  disabled = false,
  className = '',
  id,
  allowDecimals = false,
  showStepper = true
}) => {
  // Format number with Indonesian dot separators
  const formatWithDots = (val: number | ''): string => {
    if (val === '' || val === undefined || val === null) return ''
    if (val === 0) return '0'

    if (allowDecimals) {
      // Split integer and decimal parts
      const parts = val.toString().split('.')
      const integerPart = parseInt(parts[0], 10) || 0
      const formattedInteger = integerPart.toLocaleString('id-ID')
      return parts.length > 1 ? `${formattedInteger},${parts[1]}` : formattedInteger
    }

    return Math.round(val).toLocaleString('id-ID')
  }

  const [displayValue, setDisplayValue] = useState<string>(() => formatWithDots(value))

  useEffect(() => {
    setDisplayValue(formatWithDots(value))
  }, [value, allowDecimals])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    if (raw === '') {
      setDisplayValue('')
      onChange(0)
      return
    }

    if (allowDecimals) {
      // Allow digits and single comma or dot
      const clean = raw.replace(/[^0-9,.]/g, '').replace(/,/g, '.')
      const num = parseFloat(clean)
      if (isNaN(num)) {
        setDisplayValue('')
        onChange(0)
        return
      }
      let finalNum = num
      if (max !== undefined && finalNum > max) finalNum = max
      if (min !== undefined && finalNum < min) finalNum = min
      setDisplayValue(raw)
      onChange(finalNum)
      return
    }

    // Integers: strip everything except digits
    const digitsOnly = raw.replace(/\D/g, '')
    if (!digitsOnly) {
      setDisplayValue('')
      onChange(0)
      return
    }

    let num = parseInt(digitsOnly, 10)
    if (isNaN(num)) {
      setDisplayValue('')
      onChange(0)
      return
    }

    if (max !== undefined && num > max) num = max
    if (min !== undefined && num < min) num = min

    setDisplayValue(num.toLocaleString('id-ID'))
    onChange(num)
  }

  const handleIncrement = () => {
    if (disabled) return
    const current = typeof value === 'number' ? value : 0
    let next = current + step
    if (max !== undefined && next > max) next = max
    setDisplayValue(formatWithDots(next))
    onChange(next)
  }

  const handleDecrement = () => {
    if (disabled) return
    const current = typeof value === 'number' ? value : 0
    let next = current - step
    if (min !== undefined && next < min) next = min
    setDisplayValue(formatWithDots(next))
    onChange(next)
  }

  const handleBlur = () => {
    if (displayValue === '') {
      if (required) {
        setDisplayValue(formatWithDots(min))
        onChange(min)
      }
    } else {
      const current = typeof value === 'number' ? value : 0
      setDisplayValue(formatWithDots(current))
    }
  }

  return (
    <div
      className={`relative flex items-center bg-stone-950 border border-stone-800 rounded-xl focus-within:border-[#E2DFD2] focus-within:ring-1 focus-within:ring-[#E2DFD2]/20 transition-all overflow-hidden ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    >
      {prefix && (
        <span className="pl-3 pr-1 text-xs font-mono font-bold text-stone-400 select-none">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full bg-transparent px-3 py-2 text-stone-100 font-mono font-bold text-sm focus:outline-none placeholder-stone-600 tracking-wide"
      />
      {suffix && (
        <span className="pr-3 text-xs font-mono text-stone-500 select-none">
          {suffix}
        </span>
      )}
      {/* Optional Stepper Buttons */}
      {showStepper && (
        <div className="flex flex-col border-l border-stone-800/80 bg-stone-900/60 self-stretch shrink-0 w-8">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && typeof value === 'number' && value >= max)}
            className="flex-1 flex items-center justify-center text-stone-400 hover:text-[#E2DFD2] hover:bg-stone-800 transition-colors border-b border-stone-800/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Naikkan (+)"
            tabIndex={-1}
          >
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && typeof value === 'number' && value <= min)}
            className="flex-1 flex items-center justify-center text-stone-400 hover:text-[#E2DFD2] hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Turunkan (-)"
            tabIndex={-1}
          >
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  )
}
