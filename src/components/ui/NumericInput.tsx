import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface NumericInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 500,
  prefix,
  placeholder = '0',
  required = false,
  disabled = false,
  className = '',
  id
}) => {
  // Format number with dots (Indonesian locale)
  const formatWithDots = (val: number) => {
    if (val === 0) return '0'
    return val.toLocaleString('id-ID')
  }

  const [displayValue, setDisplayValue] = useState<string>(
    value ? formatWithDots(value) : '0'
  )

  useEffect(() => {
    setDisplayValue(value !== undefined && value !== null ? formatWithDots(value) : '0')
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '') // remove all non-digits
    if (raw === '') {
      setDisplayValue('')
      onChange(0)
      return
    }

    const num = parseInt(raw, 10)
    if (isNaN(num)) {
      setDisplayValue('0')
      onChange(0)
      return
    }

    let finalNum = num
    if (max !== undefined && finalNum > max) finalNum = max
    if (min !== undefined && finalNum < min) finalNum = min

    setDisplayValue(formatWithDots(finalNum))
    onChange(finalNum)
  }

  const handleIncrement = () => {
    if (disabled) return
    const current = value || 0
    let next = current + step
    if (max !== undefined && next > max) next = max
    setDisplayValue(formatWithDots(next))
    onChange(next)
  }

  const handleDecrement = () => {
    if (disabled) return
    const current = value || 0
    let next = current - step
    if (min !== undefined && next < min) next = min
    setDisplayValue(formatWithDots(next))
    onChange(next)
  }

  const handleBlur = () => {
    if (displayValue === '' || isNaN(value)) {
      const fallback = min !== undefined ? min : 0
      setDisplayValue(formatWithDots(fallback))
      onChange(fallback)
    } else {
      setDisplayValue(formatWithDots(value))
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
        inputMode="numeric"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full bg-transparent px-3 py-2 text-stone-100 font-mono font-bold text-sm focus:outline-none placeholder-stone-600 tracking-wide"
      />
      {/* UI Naik-Turun (Custom Stepper) */}
      <div className="flex flex-col border-l border-stone-800/80 bg-stone-900/60 self-stretch shrink-0 w-8">
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="flex-1 flex items-center justify-center text-stone-400 hover:text-[#E2DFD2] hover:bg-stone-800 transition-colors border-b border-stone-800/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Naikkan (+)"
          tabIndex={-1}
        >
          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && value <= min)}
          className="flex-1 flex items-center justify-center text-stone-400 hover:text-[#E2DFD2] hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Turunkan (-)"
          tabIndex={-1}
        >
          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
