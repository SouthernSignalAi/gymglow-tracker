import { Dumbbell } from 'lucide-react'

interface LogoProps {
  className?: string
  showIcon?: boolean
}

export function Logo({ className = "", showIcon = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg opacity-20 blur-sm"></div>
        </div>
      )}
      <div className="flex flex-col">
        <h1 className="font-brand text-xl leading-tight bg-gradient-to-r from-foreground to-foreground-secondary bg-clip-text text-transparent">
          Josh Byford-Pothan
        </h1>
        <p className="text-xs text-foreground-muted font-medium tracking-wide">
          FITNESS TRACKER
        </p>
      </div>
    </div>
  )
}