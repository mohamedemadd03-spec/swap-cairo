import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  char?: string;
}

interface BrutalistBurstProps {
  active: boolean;
  type?: 'swap' | 'buyout';
  onComplete?: () => void;
}

export const BrutalistBurst: React.FC<BrutalistBurstProps> = ({
  active,
  type = 'swap',
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const colors = type === 'buyout' 
      ? ['#D4FF00', '#FFFFFF', '#00FF66', '#FFDF00'] 
      : ['#D4FF00', '#FF2A4D', '#FFFFFF', '#e0b6ff'];

    const chars = type === 'buyout'
      ? ['EGP', '$', 'BUY', '✓', '100%']
      : ['SWAP', '+', '*', 'DROP', '★', '⚡'];

    const newParticles: Particle[] = Array.from({ length: 32 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      return {
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 12 + 8,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        char: chars[Math.floor(Math.random() * chars.length)],
      };
    });

    setParticles(newParticles);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 1200) {
        clearInterval(interval);
        setParticles([]);
        if (onComplete) onComplete();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.35, // Gravity
          rotation: p.rotation + p.rotSpeed,
        }))
      );
    }, 16);

    return () => clearInterval(interval);
  }, [active, type, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg)`,
            color: p.color,
            fontSize: `${p.size}px`,
            borderColor: p.color,
          }}
          className="absolute font-mono-zine font-black select-none drop-shadow-[2px_2px_0px_#000]"
        >
          {p.char}
        </div>
      ))}
    </div>
  );
};
