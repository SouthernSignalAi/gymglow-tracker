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
import { ArrowLeft, ArrowRight, CheckCircle, Plus } from 'lucide-react'

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
  }
}

interface CompletedSet {
  set: number
  weight: number
  reps: number
}

export default function WorkoutInterface() {
  const { workoutType } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Get data from navigation state
  const { workoutId, exercises, dayType, displayName } = location.state || {}

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<{ [exerciseId: string]: CompletedSet[] }>({})
  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [workoutCompleted, setWorkoutCompleted] = useState(false)

  // Redirect if no data
  useEffect(() => {
    if (!workoutId || !exercises) {
      navigate('/')
      return
    }
  }, [workoutId, exercises, navigate])

  if (!workoutId || !exercises) {
    return null
  }

  const currentExercise: Exercise = exercises[currentExerciseIndex]
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100
  const exerciseCompletedSets = completedSets[currentExercise?.id] || []

  const incrementWeight = (amount: number) => {
    setWeight(prev => {
      const current = parseFloat(prev) || 0
      return (current + amount).toFixed(1)
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

    setIsLogging(true)
    try {
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

      await logExerciseSet(exerciseData)

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
        title: "Set Logged",
        description: `${weight}kg × ${reps} reps recorded`,
      })
    } catch (error) {
      console.error('Failed to log set:', error)
      toast({
        title: "Error",
        description: "Failed to log set. Please try again.",
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
    }
  }

  const completeWorkout = async () => {
    try {
      await updateWorkout(workoutId, {
        Completed: true,
        Duration: 60 // You could calculate actual duration
      })
      
      setWorkoutCompleted(true)
      toast({
        title: "Workout Completed!",
        description: "Great job! Your workout has been saved.",
      })
      
      setTimeout(() => navigate('/'), 2000)
    } catch (error) {
      console.error('Failed to complete workout:', error)
      toast({
        title: "Error",
        description: "Failed to save workout completion.",
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
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Current Exercise */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold mb-2">
                {currentExercise.fields.Exercisename}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
                <span>Sets: {currentExercise.fields.DefaultSets}</span>
                <span>Reps: {currentExercise.fields.DefaultRepRange}</span>
                <span>Tempo: {currentExercise.fields.DefaultTempo}</span>
                <span>Rest: {currentExercise.fields.DefaultRestTime}s</span>
              </div>
            </div>

            {/* Current Set */}
            <div className="text-center">
              <h3 className="font-medium text-lg">Set {currentSet}</h3>
            </div>

            {/* Completed Sets */}
            {exerciseCompletedSets.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Completed Sets:</h4>
                <div className="space-y-1">
                  {exerciseCompletedSets.map((set, index) => (
                    <div key={index} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                      <span>Set {set.set}</span>
                      <span>{set.weight}kg × {set.reps} reps</span>
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
              variant="default"
            >
              {isLogging ? 'Logging...' : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Log Set
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
            variant={currentExerciseIndex === exercises.length - 1 ? "default" : "outline"}
          >
            {currentExerciseIndex === exercises.length - 1 ? 'Complete Workout' : 'Next Exercise'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  )
}