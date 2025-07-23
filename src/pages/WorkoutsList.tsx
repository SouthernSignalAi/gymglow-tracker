import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, TrendingUp, Filter } from 'lucide-react'
import { getWorkouts } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'

export default function WorkoutsList() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'this-week'>('all')
  const { toast } = useToast()

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    try {
      const data = await getWorkouts()
      setWorkouts(data.records || [])
    } catch (error) {
      console.error('Failed to load workouts:', error)
      toast({
        title: "Error",
        description: "Failed to load workout history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkouts = workouts.filter(workout => {
    if (filter === 'completed') {
      return workout.fields.Completed
    }
    if (filter === 'this-week') {
      const workoutDate = new Date(workout.fields.Date)
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      return workoutDate >= weekStart
    }
    return true
  })

  if (loading) {
    return (
      <Layout title="Workout History">
        <div className="space-y-4 animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Workout History">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-5 w-5 text-foreground-muted flex-shrink-0" />
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={filter === 'this-week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('this-week')}
          >
            This Week
          </Button>
        </div>

        {/* Workout List */}
        <div className="space-y-3">
          {filteredWorkouts.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="font-display font-semibold mb-2">No workouts found</h3>
              <p className="text-foreground-muted">
                {filter === 'all' 
                  ? 'Start your first workout to see it here.' 
                  : 'No workouts match your current filter.'}
              </p>
            </Card>
          ) : (
            filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold">
                        {workout.fields.DayType}
                      </h3>
                      {workout.fields.Completed && (
                        <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(workout.fields.Date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {workout.fields.Duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{workout.fields.Duration}min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Stats Summary */}
        {filteredWorkouts.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-display font-semibold">Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {filteredWorkouts.filter(w => w.fields.Completed).length}
                </div>
                <div className="text-sm text-foreground-muted">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    filteredWorkouts
                      .filter(w => w.fields.Duration)
                      .reduce((sum, w) => sum + (w.fields.Duration || 0), 0) / 
                    filteredWorkouts.filter(w => w.fields.Duration).length || 0
                  )}min
                </div>
                <div className="text-sm text-foreground-muted">Avg Duration</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}