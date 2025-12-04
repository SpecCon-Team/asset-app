import React, { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  initialX: number;
  initialY: number;
  angle: number;
  speed: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('AnimatedBackground: Canvas ref not available');
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      console.warn('AnimatedBackground: Canvas context not available');
      return;
    }

    // Set canvas size - ensure it's set immediately
    const resizeCanvas = () => {
      if (!canvas) return;
      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      canvas.width = width;
      canvas.height = height;
    };
    
    // Initialize immediately
    resizeCanvas();
    
    // Also set size after a small delay to ensure window is ready
    let initTimeout: NodeJS.Timeout | null = setTimeout(() => {
      resizeCanvas();
      initTimeout = null;
    }, 100);
    
    window.addEventListener('resize', resizeCanvas);

    // Create large bubbles - ensure we have valid dimensions
    const canvasWidth = canvas.width || window.innerWidth || 1920;
    const canvasHeight = canvas.height || window.innerHeight || 1080;
    const bubbleCount = Math.max(6, Math.min(12, Math.floor((canvasWidth * canvasHeight) / 100000)));
    const bubbles: Bubble[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      const radius = Math.random() * 80 + 40; // Large bubbles: 40-120px
      const initialX = Math.random() * canvasWidth;
      const initialY = Math.random() * canvasHeight;
      
      bubbles.push({
        x: initialX,
        y: initialY,
        radius: radius,
        vx: (Math.random() - 0.5) * 0.3, // Slow horizontal movement
        vy: (Math.random() - 0.5) * 0.3, // Slow vertical movement
        opacity: Math.random() * 0.15 + 0.05, // Subtle opacity
        initialX: initialX,
        initialY: initialY,
        angle: Math.random() * Math.PI * 2, // Random starting angle
        speed: Math.random() * 0.5 + 0.3, // Slow speed
      });
    }

    bubblesRef.current = bubbles;

    // Animation loop
    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      timeRef.current = timestamp * 0.001; // Convert to seconds
      
      const width = canvas.width || window.innerWidth || 1920;
      const height = canvas.height || window.innerHeight || 1080;
      
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((bubble) => {
        // Slow circular/loop movement pattern
        bubble.angle += bubble.speed * 0.01;
        
        // Create a gentle floating loop motion
        const loopRadius = 50 + bubble.radius * 0.3;
        bubble.x = bubble.initialX + Math.cos(bubble.angle) * loopRadius;
        bubble.y = bubble.initialY + Math.sin(bubble.angle) * loopRadius + Math.sin(timeRef.current + bubble.angle) * 20;
        
        // Wrap around edges smoothly
        const width = canvas.width || window.innerWidth || 1920;
        const height = canvas.height || window.innerHeight || 1080;
        
        if (bubble.x < -bubble.radius) {
          bubble.x = width + bubble.radius;
          bubble.initialX = bubble.x;
        } else if (bubble.x > width + bubble.radius) {
          bubble.x = -bubble.radius;
          bubble.initialX = bubble.x;
        }
        
        if (bubble.y < -bubble.radius) {
          bubble.y = height + bubble.radius;
          bubble.initialY = bubble.y;
        } else if (bubble.y > height + bubble.radius) {
          bubble.y = -bubble.radius;
          bubble.initialY = bubble.y;
        }

        // Draw bubble with soft gradient
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.radius
        );
        
        // Soft white/light blue bubble
        gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.8})`);
        gradient.addColorStop(0.4, `rgba(200, 220, 255, ${bubble.opacity * 0.4})`);
        gradient.addColorStop(0.7, `rgba(150, 180, 255, ${bubble.opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle highlight for depth
        const highlightGradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.4,
          bubble.y - bubble.radius * 0.4,
          0,
          bubble.x - bubble.radius * 0.4,
          bubble.y - bubble.radius * 0.4,
          bubble.radius * 0.5
        );
        highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.3})`);
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)' }}
    />
  );
};

export default AnimatedBackground;

