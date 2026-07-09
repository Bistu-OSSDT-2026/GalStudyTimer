import { motion } from 'framer-motion'

interface ProgressRingProps {
  progress: number    // 0-1
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 8,
  className = '',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)))

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.3))' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
