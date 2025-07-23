import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { WorkoutCard } from '@/components/WorkoutCard'
import { createWorkout, getTodaysWorkout, getWorkouts, testConnection, getExerciseTemplates, testExerciseTemplatesAccess } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, Zap, Target } from 'lucide-react'

// All available workout types - no day restrictions
const workoutTypes = [
  { dayType: 'Push', description: 'Chest, Shoulders & Triceps' },
  { dayType: 'Lower1', description: 'Quads, Glutes & Core' },
  { dayType: 'Pull', description: 'Back, Lats & Biceps' },
  { dayType: 'Lower2', description: 'Glutes, Hamstrings & Calves' },
  { dayType: 'Arms', description: 'Biceps, Triceps & Accessories' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [workouts, setWorkouts] = useState<any[]>([])
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [loading, setLoading] = useState(true)
  const [isStartingWorkout, setIsStartingWorkout] = useState(false)
  const [loadingWorkout, setLoadingWorkout] = useState('')

  // Current date
  const now = new Date()

  useEffect(() => {
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    try {
      // Test Airtable connection
      const connectionTest = await testConnection()
      if (!connectionTest.success) {
        setConnectionStatus('error')
        toast({
          title: "Connection Error",
          description: "Unable to connect to Airtable. Please check your connection.",
          variant: "destructive",
        })
        return
      }
      setConnectionStatus('connected')

      // Fetch today's workout and recent workouts
      const [todaysWorkoutData, recentWorkouts] = await Promise.all([
        getTodaysWorkout(),
        getWorkouts()
      ])

      setTodaysWorkout(todaysWorkoutData)
      setWorkouts(recentWorkouts.records || [])
    } catch (error) {
      console.error('Dashboard initialization error:', error)
      setConnectionStatus('error')
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startWorkout = async (buttonType: string) => {
    setIsStartingWorkout(true)
    setLoadingWorkout(buttonType)
    
    try {
      // Map button names to Airtable day types
      const workoutTypeMapping = {
        'Push': 'Push',
        'Lower1': 'Lower1', 
        'Pull': 'Pull',
        'Lower2': 'Lower2',
        'Arms': 'Accessory'  // Important: Arms button uses Accessory day type
      } as const
      
      const airtableDayType = workoutTypeMapping[buttonType as keyof typeof workoutTypeMapping]
      
      console.log(`Starting ${buttonType} workout (Airtable: ${airtableDayType})...`)
      
      // TEST: Verify EXERCISE_TEMPLATES table access first
      const tableTest = await testExerciseTemplatesAccess()
      if (!tableTest.success) {
        toast({
          title: "Database Error",
          description: `Cannot access EXERCISE_TEMPLATES table: ${tableTest.error}`,
          variant: "destructive",
        })
        return
      }
      
      // 1. Create workout in Airtable
      console.log(`Creating workout with DayType: ${airtableDayType}`)
      const workoutResult = await createWorkout({
        Daytype: airtableDayType,
        "Workout Notes": `${buttonType} workout started`
      })
      
      if (!workoutResult.id) {
        throw new Error('Workout creation failed - no ID returned')
      }
      
      console.log('Workout created with ID:', workoutResult.id)
      
      // 2. Get exercise templates for this workout
      const exerciseTemplates = await getExerciseTemplates(airtableDayType)
      
      if (exerciseTemplates.length === 0) {
        toast({
          title: "No Exercises Found",
          description: `No exercises found for ${buttonType} day. Please check your Exercise Templates.`,
          variant: "destructive",
        })
        return
      }
      
      console.log(`Found ${exerciseTemplates.length} exercises for ${buttonType}`)
      
      // 3. Navigate to workout page with data
      navigate(`/workout/${buttonType}`, { 
        state: { 
          workoutId: workoutResult.id, 
          exercises: exerciseTemplates,
          dayType: airtableDayType,
          displayName: buttonType
        } 
      })
      
    } catch (error) {
      console.error('Failed to start workout:', error)
      toast({
        title: "Error",
        description: `Failed to start ${buttonType} workout. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsStartingWorkout(false)
      setLoadingWorkout('')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="grid gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  if (connectionStatus === 'error') {
    return (
      <Layout>
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-danger" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-foreground-muted mb-4">
            Unable to connect to Airtable. Please check your internet connection and try again.
          </p>
          <Button onClick={initializeDashboard}>
            Retry Connection
          </Button>
        </Card>
      </Layout>
    )
  }

  // Calculate weekly progress
  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.fields.Date)
    return isInCurrentWeek(workoutDate)
  })
  const completedThisWeek = thisWeekWorkouts.filter(w => w.fields.Completed).length
  const weeklyProgress = Math.min((completedThisWeek / 5) * 100, 100)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Welcome Back!
          </h1>
          <p className="text-foreground-muted">
            Choose any workout for today
          </p>
        </div>

        {/* Today's Workout Status */}
        {todaysWorkout?.fields.Completed && (
          <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <div className="flex items-center gap-2 text-success">
              <Target className="h-5 w-5" />
              <span className="font-medium">Today's {todaysWorkout.fields.Daytype} workout completed!</span>
            </div>
          </Card>
        )}

        {/* Weekly Progress */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold">This Week's Progress</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Workouts Completed</span>
              <span className="font-medium">{completedThisWeek}/5</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
            <p className="text-xs text-foreground-muted">
              Keep up the great work!
            </p>
          </div>
        </Card>

        {/* Choose Today's Workout */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Choose Your Workout</h2>
          </div>
          <div className="grid gap-3">
            {workoutTypes.map((workout) => {
              const todayWorkoutMatch = todaysWorkout?.fields.Daytype === workout.dayType
              const isCompleted = todayWorkoutMatch && todaysWorkout?.fields.Completed

              return (
                <Card 
                  key={workout.dayType}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    isCompleted ? 'opacity-75 bg-success/5 border-success/20' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                          {workout.dayType}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          {workout.description}
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="text-success">
                          <Target className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <Button 
                      variant={isCompleted ? "outline" : "premium"}
                      size="sm" 
                      onClick={() => startWorkout(workout.dayType)}
                      className="w-full mt-4"
                      disabled={isStartingWorkout}
                    >
                      {isStartingWorkout && loadingWorkout === workout.dayType 
                        ? 'Loading...' 
                        : isCompleted 
                          ? `Redo ${workout.dayType} Workout` 
                          : `Start ${workout.dayType} Workout`
                      }
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/progress')}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">View Progress</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/workouts')}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Workout History</span>
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

// Helper functions

function isInCurrentWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now)
  const dayOfWeek = weekStart.getDay()
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return date >= weekStart && date <= weekEnd
}
