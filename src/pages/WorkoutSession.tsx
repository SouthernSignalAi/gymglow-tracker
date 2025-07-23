import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Square, Plus, Minus } from 'lucide-react'
import { getExercisesForDay, createWorkout, logExerciseSet, updateWorkout, EXERCISE_NAMES } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'

export default function WorkoutSession() {
  const { dayType, workoutId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [currentWorkout, setCurrentWorkout] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)

  useEffect(() => {
    if (dayType && workoutId) {
      initializeWorkout()
    }
  }, [dayType, workoutId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false)
            toast({
              title: "Rest Complete!",
              description: "Time for your next set",
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer])

  const initializeWorkout = async () => {
    try {
      const exerciseList = getExercisesForDay(dayType!)
      setExercises(exerciseList)
      
      // Use existing workout ID from navigation
      setCurrentWorkout({ id: workoutId })
      setWorkoutStartTime(new Date())
      
      toast({
        title: "Workout Ready!",
        description: `${dayType} day workout loaded`,
      })
    } catch (error) {
      console.error('Failed to initialize workout:', error)
      toast({
        title: "Error",
        description: "Failed to load workout",
        variant: "destructive",
      })
    }
  }

  const logSet = async () => {
    if (!weight || !reps || !currentWorkout) return

    try {
      const exercise = exercises[currentExerciseIndex]
      
      await logExerciseSet({
        WorkoutID: workoutId,
        ExerciseName: exercise.name,
        SetNumber: currentSet,
        WeightKG: parseFloat(weight),
        RepsCompleted: parseInt(reps),
        IsMajorLift: exercise.isMajorLift,
        ExerciseOrder: exercise.order,
        Tempo: "2010",
        RestTime: 120
      })

      toast({
        title: "Set Logged!",
        description: `${weight}kg × ${reps} reps recorded`,
      })

      // Start rest timer
      setRestTimer(120) // 2 minutes default
      setIsResting(true)
      setCurrentSet(prev => prev + 1)
      
    } catch (error) {
      console.error('Failed to log set:', error)
      toast({
        title: "Error",
        description: "Failed to log set",
        variant: "destructive",
      })
    }
  }

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSet(1)
      setWeight('')
      setReps('')
      setIsResting(false)
      setRestTimer(0)
    }
  }

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1)
      setCurrentSet(1)
      setWeight('')
      setReps('')
      setIsResting(false)
      setRestTimer(0)
    }
  }

  const finishWorkout = async () => {
    if (!workoutId || !workoutStartTime) return

    try {
      const duration = Math.round((Date.now() - workoutStartTime.getTime()) / 60000)
      
      await updateWorkout(workoutId, {
        Completed: true,
        Duration: duration
      })

      toast({
        title: "Workout Complete!",
        description: `Great job! Workout completed in ${duration} minutes`,
      })

      navigate('/')
    } catch (error) {
      console.error('Failed to finish workout:', error)
      toast({
        title: "Error",
        description: "Failed to complete workout",
        variant: "destructive",
      })
    }
  }

  const adjustWeight = (amount: number) => {
    const currentWeight = parseFloat(weight) || 0
    const newWeight = Math.max(0, currentWeight + amount)
    setWeight(newWeight.toString())
  }

  if (!exercises.length) {
    return (
      <Layout title={`${dayType} Workout`} showBackButton>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading workout...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const currentExercise = exercises[currentExerciseIndex]
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100

  return (
    <Layout title={`${dayType} Workout`} showBackButton>
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Exercise {currentExerciseIndex + 1} of {exercises.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-progress-bg h-2 rounded-full">
            <div 
              className="bg-progress-fill h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rest Timer */}
        {isResting && (
          <Card className="p-6 text-center bg-warning/5 border-warning">
            <div className="text-3xl font-bold text-warning mb-2">
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-foreground-muted">Rest Time Remaining</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsResting(false)}
              className="mt-3"
            >
              Skip Rest
            </Button>
          </Card>
        )}

        {/* Current Exercise */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold mb-1">
                  {currentExercise.name.split(': ')[1] || currentExercise.name}
                </h2>
                <div className="flex gap-2">
                  <Badge variant={currentExercise.isMajorLift ? "default" : "secondary"}>
                    {currentExercise.order}
                  </Badge>
                  {currentExercise.isMajorLift && (
                    <Badge className="major-lift-indicator">
                      Major Lift
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-foreground-muted">Set</div>
                <div className="text-2xl font-bold">{currentSet}</div>
              </div>
            </div>

            {/* Previous Set Reference */}
            <div className="bg-accent/5 p-3 rounded-lg mb-4">
              <p className="text-sm text-foreground-muted mb-1">Previous workout:</p>
              <p className="text-sm font-medium">No previous data available</p>
            </div>

            {/* Weight Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Weight (kg)</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => adjustWeight(-2.5)}
                  disabled={isResting}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-center text-xl font-bold min-h-[44px] text-foreground"
                  placeholder="0.0"
                  step="0.5"
                  disabled={isResting}
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => adjustWeight(2.5)}
                  disabled={isResting}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex gap-2 justify-center">
                {[2.5, 5, 10].map(amount => (
                  <Button
                    key={amount}
                    variant="secondary"
                    size="sm"
                    onClick={() => adjustWeight(amount)}
                    disabled={isResting}
                    className="min-h-[44px] px-4"
                  >
                    +{amount}kg
                  </Button>
                ))}
              </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Reps</label>
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="text-center text-xl font-bold min-h-[44px] text-foreground"
                placeholder="0"
                disabled={isResting}
              />
            </div>

            {/* Log Set Button */}
            <Button
              variant="premium"
              size="lg"
              onClick={logSet}
              disabled={!weight || !reps || isResting}
              className="w-full min-h-[52px] text-lg font-bold"
            >
              Log Set {currentSet}
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevExercise}
            disabled={currentExerciseIndex === 0}
          >
            Previous Exercise
          </Button>

          {currentExerciseIndex === exercises.length - 1 ? (
            <Button
              variant="success"
              onClick={finishWorkout}
            >
              Finish Workout
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={nextExercise}
            >
              Next Exercise
            </Button>
          )}
        </div>
      </div>
    </Layout>
  )
}