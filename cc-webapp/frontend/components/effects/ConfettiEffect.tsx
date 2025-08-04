import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CONFETTI_COLORS = [
  "#FF5252", "#FF4081", "#E040FB", "#7C4DFF", 
  "#536DFE", "#448AFF", "#40C4FF", "#18FFFF",
  "#64FFDA", "#69F0AE", "#B2FF59", "#EEFF41", 
  "#FFFF00", "#FFD740", "#FFAB40", "#FF6E40"
];

type Confetti = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
};

export default function ConfettiEffect() {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  
  useEffect(() => {
    const particles: Confetti[] = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 30 - 50, // Start above the viewport
        size: Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2
        }
      });
    }
    
    setConfetti(particles);
    
    // Cleanup after animation
    const cleanup = setTimeout(() => {
      setConfetti([]);
    }, 5000);
    
    return () => {
      clearTimeout(cleanup);
      setConfetti([]);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-sm"
          initial={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size * 0.6}px`,
            backgroundColor: particle.color,
            rotate: particle.rotation,
          }}
          animate={{
            y: ["0vh", "120vh"],
            x: [`${particle.x}%`, `${particle.x + particle.velocity.x * 10}%`],
            rotate: [particle.rotation, particle.rotation + Math.random() * 720 - 360],
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 4,
            ease: [0.23, 0.44, 0.34, 0.99],
            repeat: 0
          }}
        />
      ))}
    </div>
  );
}
