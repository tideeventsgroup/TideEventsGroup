import React from 'react'

interface TideMarkProps {
  size?: number
  className?: string
}

export function TideMark({ size = 32, className = '' }: TideMarkProps) {
  return (
    <img
      src="/tide-logo.svg"
      alt="Tide Events Group"
      height={size}
      className={className}
      style={{ height: size, width: 'auto', display: 'inline-block', flexShrink: 0 }}
    />
  )
}

interface TideLogoProps {
  variant?: 'mark' | 'full' | 'full-white'
  className?: string
  markSize?: number
  height?: number
}

export function TideLogo({ variant = 'full', className = '', markSize = 32, height }: TideLogoProps) {
  if (variant === 'mark') {
    return <TideMark size={markSize} className={className} />
  }

  if (variant === 'full-white') {
    return (
      <img
        src="/logo-white.png"
        alt="Tide Events Group"
        height={height ?? markSize}
        style={{ height: height ?? markSize, width: 'auto', display: 'inline-block' }}
        className={className}
      />
    )
  }

  return (
    <img
      src="/tide-logo.svg"
      alt="Tide Events Group"
      height={height ?? markSize}
      style={{ height: height ?? markSize, width: 'auto', display: 'inline-block' }}
      className={className}
    />
  )
}
