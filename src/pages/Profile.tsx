import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Settings, Zap, Database, User, Info } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { testConnection } from '@/services/airtable.js'
import { useToast } from '@/hooks/use-toast'

export default function Profile() {
  const { theme, actualTheme } = useTheme()
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  const testAirtableConnection = async () => {
    setConnectionStatus('testing')
    try {
      const result = await testConnection()
      if (result.success) {
        setConnectionStatus('success')
        toast({
          title: "Connection Successful",
          description: "Airtable connection is working properly",
        })
      } else {
        setConnectionStatus('error')
        toast({
          title: "Connection Failed",
          description: `Failed to connect to Airtable (Status: ${result.status})`,
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus('error')
      toast({
        title: "Connection Error",
        description: "Unable to test Airtable connection",
        variant: "destructive",
      })
    }
    
    setTimeout(() => setConnectionStatus('idle'), 3000)
  }

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>
      case 'success':
        return <Badge className="bg-success text-success-foreground">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Test Connection</Badge>
    }
  }

  const workoutStats = {
    totalWorkouts: 47,
    completedThisWeek: 4,
    currentStreak: 12,
    favoriteDay: 'Push',
  }

  return (
    <Layout title="Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="font-brand text-2xl font-bold">Josh Byford-Pothan</h1>
              <p className="text-foreground-muted">Fitness Enthusiast</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">5-Day Split</Badge>
                <Badge className="major-lift-indicator">Strength Focused</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Workout Stats */}
        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Workout Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{workoutStats.totalWorkouts}</div>
              <div className="text-sm text-foreground-muted">Total Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{workoutStats.completedThisWeek}</div>
              <div className="text-sm text-foreground-muted">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{workoutStats.currentStreak}</div>
              <div className="text-sm text-foreground-muted">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{workoutStats.favoriteDay}</div>
              <div className="text-sm text-foreground-muted">Favorite Day</div>
            </div>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Theme Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Current Theme</div>
                <div className="text-sm text-foreground-muted capitalize">
                  {theme === 'system' ? `System (${actualTheme})` : theme.replace('-', ' ')}
                </div>
              </div>
              <ThemeToggle />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-background-secondary rounded-lg">
                <div className="font-medium">Light Mode</div>
                <div className="text-foreground-muted">Standard light theme</div>
              </div>
              <div className="p-3 bg-background-secondary rounded-lg">
                <div className="font-medium">Dark Mode</div>
                <div className="text-foreground-muted">Standard dark theme</div>
              </div>
              <div className="p-3 bg-background-secondary rounded-lg">
                <div className="font-medium">Gym Dark</div>
                <div className="text-foreground-muted">Red-shifted for night vision</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Data & Connection */}
        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data & Connection
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Airtable Connection</div>
                <div className="text-sm text-foreground-muted">
                  Test connection to your fitness data
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getConnectionBadge()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testAirtableConnection}
                  disabled={connectionStatus === 'testing'}
                >
                  Test
                </Button>
              </div>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium mb-1">Data Storage</div>
                  <div className="text-foreground-muted">
                    All workout data is stored securely in Airtable. Your progress, 
                    exercise logs, and personal records are automatically synced and backed up.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Workout Preferences */}
        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4">Workout Preferences</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Weight Unit</span>
              <Badge variant="outline">Kilograms (kg)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Default Rest Time</span>
              <Badge variant="outline">2 minutes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Workout Split</span>
              <Badge variant="outline">5-Day Push/Pull/Legs</Badge>
            </div>
          </div>
        </Card>

        {/* App Information */}
        <Card className="p-6">
          <h2 className="font-display font-semibold mb-4">App Information</h2>
          <div className="space-y-2 text-sm text-foreground-muted">
            <div>Josh Byford-Pothan Fitness Tracker</div>
            <div>Version 1.0.0</div>
            <div>Built with React, TypeScript & Airtable</div>
            <div className="pt-2">
              <Badge variant="outline" className="text-xs">
                Premium Mobile-First Design
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}