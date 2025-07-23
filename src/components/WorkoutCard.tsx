import { Calendar, Clock, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface WorkoutCardProps {
  dayType: string
  dayName: string
  isCompleted: boolean
  isToday: boolean
  duration?: number
  date: Date
  onStart: () => void
  onView: () => void
}

const dayTypeColors = {
  Push: 'from-blue-500 to-blue-600',
  Lower1: 'from-green-500 to-green-600', 
  Pull: 'from-purple-500 to-purple-600',
  Lower2: 'from-orange-500 to-orange-600',
  Arms: 'from-red-500 to-red-600',
}

const dayDescriptions = {
  Push: 'Chest, Shoulders & Triceps',
  Lower1: 'Quads, Glutes & Core',
  Pull: 'Back, Lats & Biceps', 
  Lower2: 'Glutes, Hamstrings & Calves',
  Arms: 'Biceps, Triceps & Accessories',
}

export function WorkoutCard({ 
  dayType, 
  dayName, 
  isCompleted, 
  isToday, 
  duration, 
  date, 
  onStart, 
  onView 
}: WorkoutCardProps) {
  const gradient = dayTypeColors[dayType as keyof typeof dayTypeColors] || 'from-gray-500 to-gray-600'
  const description = dayDescriptions[dayType as keyof typeof dayDescriptions] || ''

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isToday ? 'ring-2 ring-primary shadow-lg' : ''
    } ${isCompleted ? 'opacity-75' : ''}`}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {dayType}
              </h3>
              {isToday && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Today
                </span>
              )}
            </div>
            <p className="text-sm text-foreground-secondary font-medium">
              {dayName}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {description}
            </p>
          </div>
          
          <div className="flex items-center">
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <Circle className="h-6 w-6 text-foreground-muted" />
            )}
          </div>
        </div>

        {/* Workout Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-foreground-muted">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration}min</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isCompleted ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onView}
              className="flex-1"
            >
              View Workout
            </Button>
          ) : (
            <Button 
              variant={isToday ? "premium" : "default"}
              size="sm" 
              onClick={onStart}
              className="flex-1"
            >
              {isToday ? "Start Today's Workout" : "Start Workout"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}