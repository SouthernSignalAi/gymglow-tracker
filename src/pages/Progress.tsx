import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { getMajorLiftsProgress } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'

const timeRanges = [
  { label: '1 Month', value: '1month' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: '1 Year', value: '1year' },
]

const majorLifts = [
  { name: 'Push-A: Smith Machine Low Incline Chest Press (Ramp)', category: 'Push' },
  { name: 'Push-B: Smith Machine Low Incline Chest Press (3x5+5+5)', category: 'Push' },
  { name: 'Lower1-A: Linear Hack Machine/Leg Press (Ramp)', category: 'Lower1' },
  { name: 'Lower1-B: Linear Hack Machine/Leg Press (3x5+5+5)', category: 'Lower1' },
  { name: 'Pull-A: Seated Row - Pronated MAG (Ramp)', category: 'Pull' },
  { name: 'Pull-B: Seated Row - Pronated MAG (3x5+5+5)', category: 'Pull' },
  { name: 'Lower2-A: Hip Thrust (Ramp)', category: 'Lower2' },
  { name: 'Lower2-B: Hip Thrust (3x8-10)', category: 'Lower2' },
  { name: 'Arms-A1: BB Curl', category: 'Arms' },
  { name: 'Arms-A2: Tricep Dips', category: 'Arms' },
]

export default function Progress() {
  const [progressData, setProgressData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState('3months')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadProgressData()
  }, [timeRange])

  const loadProgressData = async () => {
    try {
      setLoading(true)
      const data = await getMajorLiftsProgress(timeRange)
      setProgressData(data.records || [])
    } catch (error) {
      console.error('Failed to load progress data:', error)
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getExerciseProgress = (exerciseName: string) => {
    const exerciseData = progressData.filter(record => 
      record.fields.ExerciseName === exerciseName
    )

    if (exerciseData.length === 0) return null

    // Sort by date
    exerciseData.sort((a, b) => new Date(a.fields.Date).getTime() - new Date(b.fields.Date).getTime())

    const latest = exerciseData[exerciseData.length - 1]
    const previous = exerciseData.length > 1 ? exerciseData[exerciseData.length - 2] : null
    
    let trend = 'stable'
    let change = 0
    
    if (previous) {
      const latestMax = Math.max(...exerciseData.slice(-3).map(d => d.fields.WeightKG))
      const previousMax = Math.max(...exerciseData.slice(-6, -3).map(d => d.fields.WeightKG))
      
      if (latestMax > previousMax) {
        trend = 'up'
        change = latestMax - previousMax
      } else if (latestMax < previousMax) {
        trend = 'down'
        change = previousMax - latestMax
      }
    }

    return {
      currentWeight: latest.fields.WeightKG,
      currentReps: latest.fields.RepsCompleted,
      lastWorkout: new Date(latest.fields.Date),
      totalSets: exerciseData.length,
      trend,
      change,
      maxWeight: Math.max(...exerciseData.map(d => d.fields.WeightKG)),
      data: exerciseData
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-danger" />
      default:
        return <Minus className="h-4 w-4 text-foreground-muted" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-success'
      case 'down':
        return 'text-danger'
      default:
        return 'text-foreground-muted'
    }
  }

  if (loading) {
    return (
      <Layout title="Progress Tracking">
        <div className="space-y-6">
          <div className="flex gap-2 animate-pulse">
            {timeRanges.map((_, i) => (
              <div key={i} className="h-9 w-20 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Progress Tracking">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.value)}
              className="whitespace-nowrap"
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Progress Cards */}
        <div className="space-y-4">
          {majorLifts.map((lift) => {
            const progress = getExerciseProgress(lift.name)
            
            if (!progress) {
              return (
                <Card key={lift.name} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold mb-1">
                        {lift.name.split(': ')[1] || lift.name}
                      </h3>
                      <Badge variant="secondary">{lift.category}</Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground-muted">No data</div>
                    </div>
                  </div>
                </Card>
              )
            }

            return (
              <Card key={lift.name} className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold mb-1">
                        {lift.name.split(': ')[1] || lift.name}
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{lift.category}</Badge>
                        <Badge className="major-lift-indicator">Major Lift</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(progress.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(progress.trend)}`}>
                        {progress.change > 0 && (progress.trend === 'up' ? '+' : '-')}
                        {progress.change > 0 ? `${progress.change}kg` : 'Stable'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {progress.currentWeight}kg
                      </div>
                      <div className="text-xs text-foreground-muted">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {progress.maxWeight}kg
                      </div>
                      <div className="text-xs text-foreground-muted">Max</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {progress.currentReps}
                      </div>
                      <div className="text-xs text-foreground-muted">Last Reps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {progress.totalSets}
                      </div>
                      <div className="text-xs text-foreground-muted">Total Sets</div>
                    </div>
                  </div>

                  {/* Last Workout */}
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Last workout: {progress.lastWorkout.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Summary Stats */}
        {progressData.length > 0 && (
          <Card className="p-6">
            <h3 className="font-display font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {progressData.length}
                </div>
                <div className="text-sm text-foreground-muted">Total Sets Logged</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Set(progressData.map(d => new Date(d.fields.Date).toDateString())).size}
                </div>
                <div className="text-sm text-foreground-muted">Workout Days</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}