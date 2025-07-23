import { ReactNode } from 'react'
import { Home, Dumbbell, TrendingUp, User, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useLocation, useNavigate } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, path: '/progress' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
]

export function Layout({ children, title, showBackButton = false }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const currentPath = location.pathname

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {title ? (
              <h1 className="font-display text-lg font-semibold text-foreground">
                {title}
              </h1>
            ) : (
              <Logo />
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[60px] ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}