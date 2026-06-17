import React from 'react'

interface TideLogoProps {
  variant?: 'mark' | 'full' | 'full-white'
  className?: string
  markSize?: number
}

export function TideLogo({ variant = 'full', className = '', markSize = 32 }: TideLogoProps) {
  const textColor = variant === 'full-white' ? 'text-white' : 'text-navy'

  if (variant === 'mark') {
    return <TideMark size={markSize} className={className} />
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <TideMark size={markSize} />
      <div>
        <div className={`font-bold leading-tight tracking-tight ${textColor}`} style={{ fontSize: markSize * 0.56 }}>
          Tide Events Group
        </div>
        {markSize >= 36 && (
          <div className={`leading-none ${variant === 'full-white' ? 'text-white/60' : 'text-gray-400'}`} style={{ fontSize: markSize * 0.28 }}>
            Incident management system
          </div>
        )}
      </div>
    </div>
  )
}

export function TideMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M50 2L94 20V54C94 78 74 96 50 110C26 96 6 78 6 54V20L50 2Z" fill="#E8521A"/>
      <path d="M50 20L78 32V54C78 70 66 82 50 92C34 82 22 70 22 54V32L50 20Z" fill="#C94115"/>
      <path d="M36 42C36 42 40 30 50 30C60 30 64 42 64 42V62C64 62 60 74 50 74C40 74 36 62 36 62V42Z" fill="white" opacity="0.95"/>
      <path d="M44 46C44 46 46 40 50 40C54 40 56 46 56 46V58C56 58 54 64 50 64C46 64 44 58 44 58V46Z" fill="#E8521A"/>
    </svg>
  )
}
