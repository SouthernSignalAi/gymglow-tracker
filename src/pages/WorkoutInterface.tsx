import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { logExerciseSet, updateWorkout } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle, Plus, Clock, Dumbbell } from 'lucide-react'

interface Exercise {
  id: string
  fields: {
    Exercisename: string
    ExerciseOrder: string
    DefaultSets: number
    DefaultRepRange: string
    DefaultTempo: string
    DefaultRestTime: number
    IsMajorLift: string
    ExerciseType: string
    Daytype: string
  }
}

interface CompletedSet {
  set: number
  weight: number
  reps: number
}

interface WorkoutData {
  workoutId: string
  exercises: Exercise[]
  dayType: string
  displayName: string
  buttonType: string
}

export default function WorkoutInterface() {
  const { workoutType } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Get data from navigation state with better error handling
  const workoutData = location.state as WorkoutData | null
  const { workoutId, exercises, dayType, displayName } = workoutData || {}

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<{ [exerciseId: string]: CompletedSet[] }>({})
  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [workoutCompleted, setWorkoutCompleted] = useState(false)
  const [workoutStartTime] = useState(new Date())

  // Enhanced data validation and error handling
  useEffect(() => {
    console.log('🔍 WorkoutInterface mounted with params:', { workoutType })
    console.log('📊 Location state:', location.state)
    console.log('🎯 Workout data:', workoutData)

    if (!workoutData) {
      console.error('❌ No workout data in location.state')
      toast({
        title: "Workout Data Missing",
        description: "No workout data found. Returning to dashboard.",
        variant: "destructive",
      })
      navigate('/', { replace: true })
      return
    }

    if (!workoutId) {
      console.error('❌ No workoutId in workout data')
      toast({
        title: "Workout ID Missing",
        description: "Invalid workout session. Returning to dashboard.",
        variant: "destructive",
      })
      navigate('/', { replace: true })
      return
    }

    if (!exercises || exercises.length === 0) {
      console.error('❌ No exercises in workout data')
      toast({
        title: "No Exercises Found",
        description: "No exercises found for this workout. Returning to dashboard.",
        variant: "destructive",
      })
      navigate('/', { replace: true })
      return
    }

    console.log('✅ Workout data validation passed')
    console.log(`🏋️ Starting ${displayName} workout with ${exercises.length} exercises`)
    
    // Show success toast
    toast({
      title: `${displayName} Workout Started`,
      description: `Ready to begin with ${exercises.length} exercises`,
    })
  }, [workoutData, workoutId, exercises, displayName, navigate, toast, workoutType, location.state])

  // Early return if no data - component will redirect via useEffect
  if (!workoutData || !workoutId || !exercises || exercises.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="font-display text-lg font-semibold mb-2">Loading Workout...</h2>
            <p className="text-foreground-muted text-sm">
              Preparing your {workoutType} workout
            </p>
          </Card>
        </div>
      </Layout>
    )
  }

  const currentExercise: Exercise = exercises[currentExerciseIndex]
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100
  const exerciseCompletedSets = completedSets[currentExercise?.id] || []

  const incrementWeight = (amount: number) => {
    setWeight(prev => {
      const current = parseFloat(prev) || 0
      return Math.max(0, current + amount).toFixed(1)
    })
  }

  const logSet = async () => {
    if (!weight || !reps) {
      toast({
        title: "Missing Data",
        description: "Please enter both weight and reps",
        variant: "destructive",
      })
      return
    }

    if (!currentExercise?.fields?.Exercisename) {
      toast({
        title: "Exercise Error",
        description: "Current exercise data is invalid",
        variant: "destructive",
      })
      return
    }

    setIsLogging(true)
    try {
      console.log(`📝 Logging set ${currentSet} for ${currentExercise.fields.Exercisename}`)
      
      // Log to Airtable
      const exerciseData = {
        WorkoutID: workoutId,
        ExerciseName: currentExercise.fields.Exercisename,
        SetNumber: currentSet,
        WeightKG: parseFloat(weight),
        RepsCompleted: parseInt(reps),
        IsMajorLift: currentExercise.fields.IsMajorLift === 'Yes',
        ExerciseOrder: currentExercise.fields.ExerciseOrder,
        Tempo: currentExercise.fields.DefaultTempo || "2010",
        RestTime: currentExercise.fields.DefaultRestTime || 120
      }

      console.log('📊 Exercise data to log:', exerciseData)
      const result = await logExerciseSet(exerciseData)
      console.log('✅ Set logged successfully:', result)

      // Add to local sets array
      const newSet: CompletedSet = { 
        set: currentSet, 
        weight: parseFloat(weight), 
        reps: parseInt(reps) 
      }
      
      setCompletedSets(prev => ({
        ...prev,
        [currentExercise.id]: [...(prev[currentExercise.id] || []), newSet]
      }))
      
      // Reset for next set
      setCurrentSet(prev => prev + 1)
      setWeight('')
      setReps('')
      
      toast({
        title: "Set Logged Successfully",
        description: `${weight}kg × ${reps} reps recorded for ${currentExercise.fields.Exercisename}`,
      })
    } catch (error) {
      console.error('❌ Failed to log set:', error)
      toast({
        title: "Logging Failed",
        description: `Failed to log set: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLogging(false)
    }
  }

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSet(1)
      setWeight('')
      setReps('')
      console.log(`➡️ Moving to exercise ${currentExerciseIndex + 2}/${exercises.length}`)
    } else {
      completeWorkout()
    }
  }

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1)
      const prevExercise = exercises[currentExerciseIndex - 1]
      const prevSets = completedSets[prevExercise.id] || []
      setCurrentSet(prevSets.length + 1)
      setWeight('')
      setReps('')
      console.log(`⬅️ Moving to exercise ${currentExerciseIndex}/${exercises.length}`)
    }
  }

  const completeWorkout = async () => {
    try {
      console.log('🏁 Completing workout...')
      const duration = Math.round((Date.now() - workoutStartTime.getTime()) / 60000)
      
      await updateWorkout(workoutId, {
        Completed: true,
        Duration: duration
      })
      
      setWorkoutCompleted(true)
      console.log(`✅ Workout completed in ${duration} minutes`)
      
      toast({
        title: "Workout Complete! 🎉",
        description: `Amazing work! You completed your ${displayName} workout in ${duration} minutes.`,
      })
      
      setTimeout(() => navigate('/'), 2000)
    } catch (error) {
      console.error('❌ Failed to complete workout:', error)
      toast({
        title: "Completion Error",
        description: "Failed to save workout completion. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (workoutCompleted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Workout Complete!</h2>
            <p className="text-foreground-muted">
              Excellent work on your {displayName} workout. Returning to dashboard...
            </p>
            <div className="mt-4 p-3 bg-success/10 rounded-lg">
              <p className="text-success text-sm font-medium">
                🏆 {Object.values(completedSets).reduce((total, sets) => total + sets.length, 0)} sets completed
              </p>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="text-center">
            <h1 className="font-display text-lg font-semibold">{displayName} Workout</h1>
            <p className="text-sm text-foreground-muted">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </p>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Progress */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Workout Progress</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-foreground-muted mt-1">
            <span>{Math.round(progress)}% Complete</span>
            <span>{Object.values(completedSets).reduce((total, sets) => total + sets.length, 0)} sets logged</span>
          </div>
        </Card>

        {/* Current Exercise */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg font-semibold">
                  {currentExercise.fields.Exercisename}
                </h2>
                <Badge variant={currentExercise.fields.IsMajorLift === 'Yes' ? "default" : "secondary"}>
                  {currentExercise.fields.ExerciseOrder}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
                <span>Sets: {currentExercise.fields.DefaultSets}</span>
                <span>Reps: {currentExercise.fields.DefaultRepRange}</span>
                <span>Tempo: {currentExercise.fields.DefaultTempo}</span>
                <span>Rest: {currentExercise.fields.DefaultRestTime}s</span>
              </div>
              {currentExercise.fields.IsMajorLift === 'Yes' && (
                <Badge className="major-lift-indicator mt-2">
                  🏆 Major Lift
                </Badge>
              )}
            </div>

            {/* Current Set */}
            <div className="text-center">
              <h3 className="font-medium text-xl">Set {currentSet}</h3>
            </div>

            {/* Completed Sets */}
            {exerciseCompletedSets.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Completed Sets:
                </h4>
                <div className="space-y-1">
                  {exerciseCompletedSets.map((set, index) => (
                    <div key={index} className="flex justify-between text-sm bg-success/5 p-2 rounded border border-success/20">
                      <span className="font-medium">Set {set.set}</span>
                      <span className="text-success font-medium">{set.weight}kg × {set.reps} reps</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Input */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <div className="space-y-2">
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                  step="0.5"
                  className="text-center text-lg h-12"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => incrementWeight(2.5)}
                    className="flex-1"
                  >
                    +2.5kg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => incrementWeight(5)}
                    className="flex-1"
                  >
                    +5kg
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => incrementWeight(10)}
                    className="flex-1"
                  >
                    +10kg
                  </Button>
                </div>
              </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="0"
                className="text-center text-lg h-12"
              />
            </div>

            {/* Log Set Button */}
            <Button
              onClick={logSet}
              disabled={!weight || !reps || isLogging}
              className="w-full h-12 text-lg"
              variant="premium"
            >
              {isLogging ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                  Logging...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Log Set {currentSet}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={previousExercise}
            disabled={currentExerciseIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={nextExercise}
            className="flex-1"
            variant={currentExerciseIndex === exercises.length - 1 ? "success" : "outline"}
          >
            {currentExerciseIndex === exercises.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Workout
              </>
            ) : (
              <>
                Next Exercise
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Debug Panel - Remove this in production */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Debug Info</h3>
            <div className="text-xs space-y-1">
              <div>Workout ID: {workoutId}</div>
              <div>Current Exercise: {currentExerciseIndex + 1}/{exercises.length}</div>
              <div>Exercise Name: {currentExercise?.fields?.Exercisename}</div>
              <div>Current Set: {currentSet}</div>
              <div>Total Sets Logged: {Object.values(completedSets).reduce((total, sets) => total + sets.length, 0)}</div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}