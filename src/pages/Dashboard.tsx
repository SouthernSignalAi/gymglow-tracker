import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { WorkoutCard } from '@/components/WorkoutCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, Zap, Target } from 'lucide-react'
import { getTodaysWorkout, getWorkouts, testConnection } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'

// Weekly workout schedule
const weeklySchedule = [
  { dayType: 'Push', dayName: 'Monday', dayOfWeek: 1 },
  { dayType: 'Lower1', dayName: 'Tuesday', dayOfWeek: 2 },
  { dayType: 'Pull', dayName: 'Wednesday', dayOfWeek: 3 },
  { dayType: 'Lower2', dayName: 'Thursday', dayOfWeek: 4 },
  { dayType: 'Arms', dayName: 'Friday', dayOfWeek: 5 },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [workouts, setWorkouts] = useState<any[]>([])
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [loading, setLoading] = useState(true)

  // Get current week dates
  const now = new Date()
  const currentWeek = getWeekDates(now)
  const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // Convert Sunday from 0 to 7
  const todaysSchedule = weeklySchedule.find(s => s.dayOfWeek === todayDayOfWeek)

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

  const handleStartWorkout = (dayType: string) => {
    navigate(`/workout/${dayType.toLowerCase()}`)
  }

  const handleViewWorkout = (dayType: string) => {
    navigate(`/workout/${dayType.toLowerCase()}/view`)
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
  const weeklyProgress = (completedThisWeek / 5) * 100

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Welcome Back!
          </h1>
          <p className="text-foreground-muted">
            {todaysSchedule ? `Today is ${todaysSchedule.dayName} - ${todaysSchedule.dayType} Day` : "Rest Day"}
          </p>
        </div>

        {/* Today's Workout Highlight */}
        {todaysSchedule && (
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold">Today's Focus</h2>
                <p className="text-sm text-foreground-muted">{todaysSchedule.dayType} Day</p>
              </div>
            </div>
            
            {todaysWorkout?.fields.Completed ? (
              <div className="flex items-center gap-2 text-success">
                <Target className="h-5 w-5" />
                <span className="font-medium">Workout Completed!</span>
              </div>
            ) : (
              <Button 
                variant="premium" 
                size="lg" 
                onClick={() => handleStartWorkout(todaysSchedule.dayType)}
                className="w-full"
              >
                Start {todaysSchedule.dayType} Workout
              </Button>
            )}
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
              {5 - completedThisWeek} workouts remaining this week
            </p>
          </div>
        </Card>

        {/* This Week's Schedule */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">This Week</h2>
          </div>
          <div className="space-y-3">
            {weeklySchedule.map((schedule, index) => {
              const workoutDate = currentWeek[index]
              const isToday = workoutDate.toDateString() === now.toDateString()
              const workoutRecord = thisWeekWorkouts.find(w => {
                const wDate = new Date(w.fields.Date)
                return wDate.toDateString() === workoutDate.toDateString()
              })
              const isCompleted = workoutRecord?.fields.Completed || false
              const duration = workoutRecord?.fields.Duration

              return (
                <WorkoutCard
                  key={schedule.dayType}
                  dayType={schedule.dayType}
                  dayName={schedule.dayName}
                  isCompleted={isCompleted}
                  isToday={isToday}
                  duration={duration}
                  date={workoutDate}
                  onStart={() => handleStartWorkout(schedule.dayType)}
                  onView={() => handleViewWorkout(schedule.dayType)}
                />
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
function getWeekDates(date: Date): Date[] {
  const week = []
  const startOfWeek = new Date(date)
  const dayOfWeek = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Sunday
  startOfWeek.setDate(diff)

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    week.push(day)
  }
  return week.slice(0, 5) // Return only weekdays
}

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