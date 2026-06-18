import React from 'react'

interface TideMarkProps {
  size?: number
  className?: string
  black?: boolean
}

export function TideMark({ size = 32, className = '', black = false }: TideMarkProps) {
  return (
    <img
      src="/tide-logo.svg"
      alt="Tide Events Group"
      height={size}
      className={className}
      style={{ height: size, width: 'auto', display: 'inline-block', flexShrink: 0, ...(black ? { filter: 'brightness(0)' } : {}) }}
    />
  )
}

interface TideLogoProps {
  variant?: 'mark' | 'full' | 'full-white' | 'full-black'
  className?: string
  markSize?: number
  height?: number
}

export function TideLogo({ variant = 'full', className = '', markSize = 32, height }: TideLogoProps) {
  const h = height ?? markSize

  if (variant === 'mark') {
    return <TideMark size={h} className={className} />
  }

  if (variant === 'full-white') {
    return (
      <img
        src="/logo-white.png"
        alt="Tide Events Group"
        height={h}
        style={{ height: h, width: 'auto', display: 'inline-block' }}
        className={className}
      />
    )
  }

  if (variant === 'full-black') {
    return (
      <img
        src="/tide-logo.svg"
        alt="Tide Events Group"
        height={h}
        style={{ height: h, width: 'auto', display: 'inline-block', filter: 'brightness(0)' }}
        className={className}
      />
    )
  }

  return (
    <img
      src="/tide-logo.svg"
      alt="Tide Events Group"
      height={h}
      style={{ height: h, width: 'auto', display: 'inline-block' }}
      className={className}
    />
  )
}
