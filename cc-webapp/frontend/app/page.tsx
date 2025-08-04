import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient-primary">
            Casino Club F2P
          </h1>
          <p className="text-xl text-muted-foreground">
            Welcome to the Ultimate Neon Cyberpunk Gaming Experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          <Card className="glass-metal glass-metal-hover p-6">
            <h3 className="text-xl font-semibold text-gradient-primary mb-2">
              Neon Slots
            </h3>
            <p className="text-muted-foreground mb-4">
              Experience the thrill of cyberpunk slot machines
            </p>
            <Button className="w-full btn-hover-lift">
              Play Now
            </Button>
          </Card>
          
          <Card className="glass-metal glass-metal-hover p-6">
            <h3 className="text-xl font-semibold text-gradient-gold mb-2">
              Rock Paper Scissors
            </h3>
            <p className="text-muted-foreground mb-4">
              Classic game with a futuristic twist
            </p>
            <Button className="w-full btn-hover-lift">
              Challenge
            </Button>
          </Card>
          
          <Card className="glass-metal glass-metal-hover p-6">
            <h3 className="text-xl font-semibold text-gradient-metal mb-2">
              Gacha System
            </h3>
            <p className="text-muted-foreground mb-4">
              Collect rare items and rewards
            </p>
            <Button className="w-full btn-hover-lift">
              Open Box
            </Button>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            🎮 Powered by Tailwind CSS V4 + Next.js 15 + React 19
          </p>
        </div>
      </div>
    </div>
  )
}
