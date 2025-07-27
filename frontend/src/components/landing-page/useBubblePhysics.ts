import { useState, useEffect, useRef, useCallback } from 'react'

interface BubblePosition {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  id: string
  originalX: number
  originalY: number
}

interface UseBubblePhysicsProps {
  bubbles: Array<{ id: string; x: number; y: number }>
  containerWidth: number
  containerHeight: number
  enabled: boolean
}

export const useBubblePhysics = ({
  bubbles,
  containerWidth,
  containerHeight,
  enabled
}: UseBubblePhysicsProps) => {
  const [positions, setPositions] = useState<Record<string, BubblePosition>>({})
  const [center, setCenter] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // Initialize bubble positions
  useEffect(() => {
    const initialPositions: Record<string, BubblePosition> = {}
    
    bubbles.forEach(bubble => {
      initialPositions[bubble.id] = {
        x: bubble.x,
        y: bubble.y,
        vx: (Math.random() - 0.5) * 0.5, // Small random velocity
        vy: (Math.random() - 0.5) * 0.5,
        radius: 50, // Bubble collision radius
        id: bubble.id,
        originalX: bubble.x,
        originalY: bubble.y
      }
    })
    
    setPositions(initialPositions)
  }, [bubbles])

  // Physics simulation
  const updatePhysics = useCallback((currentTime: number) => {
    if (!enabled) return

    const deltaTime = currentTime - lastTimeRef.current
    if (deltaTime < 16) return // Limit to ~60fps

    lastTimeRef.current = currentTime

    setPositions(prevPositions => {
      const newPositions = { ...prevPositions }
      const bubbleArray = Object.values(newPositions)

      // Apply forces between bubbles
      bubbleArray.forEach((bubble, i) => {
        let fx = 0
        let fy = 0

        // Repulsion from other bubbles
        bubbleArray.forEach((other, j) => {
          if (i === j) return

          const dx = bubble.x - other.x
          const dy = bubble.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minDistance = bubble.radius + other.radius

          if (distance < minDistance && distance > 0) {
            const force = (minDistance - distance) * 0.01
            const angle = Math.atan2(dy, dx)
            fx += Math.cos(angle) * force
            fy += Math.sin(angle) * force
          }
        })

        // Spring force back to original position
        const springForce = 0.002
        const dampening = 0.95
        
        fx += (bubble.originalX - bubble.x) * springForce
        fy += (bubble.originalY - bubble.y) * springForce

        // Update velocity
        bubble.vx = (bubble.vx + fx) * dampening
        bubble.vy = (bubble.vy + fy) * dampening

        // Limit velocity
        const maxVelocity = 2
        const velocity = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy)
        if (velocity > maxVelocity) {
          bubble.vx = (bubble.vx / velocity) * maxVelocity
          bubble.vy = (bubble.vy / velocity) * maxVelocity
        }

        // Update position
        bubble.x += bubble.vx
        bubble.y += bubble.vy

        // Keep bubbles within reasonable bounds
        const maxDistance = 20 // Reduced max distance
        const distanceFromOriginal = Math.sqrt(
          Math.pow(bubble.x - bubble.originalX, 2) + 
          Math.pow(bubble.y - bubble.originalY, 2)
        )
        
        if (distanceFromOriginal > maxDistance) {
          const angle = Math.atan2(
            bubble.y - bubble.originalY, 
            bubble.x - bubble.originalX
          )
          bubble.x = bubble.originalX + Math.cos(angle) * maxDistance
          bubble.y = bubble.originalY + Math.sin(angle) * maxDistance
        }

        newPositions[bubble.id] = bubble
      })

      // Calculate new center
      let totalX = 0
      let totalY = 0
      bubbleArray.forEach(b => {
        totalX += b.x
        totalY += b.y
      })
      setCenter({
        x: totalX / bubbleArray.length,
        y: totalY / bubbleArray.length
      })

      return newPositions
    })
  }, [enabled])

  // Animation loop
  useEffect(() => {
    if (!enabled) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const animate = (currentTime: number) => {
      updatePhysics(currentTime)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [enabled, updatePhysics])

  // Function to add disturbance to a specific bubble
  const disturbBubble = useCallback((bubbleId: string, force: number = 5) => {
    setPositions(prev => {
      const bubble = prev[bubbleId]
      if (!bubble) return prev

      const angle = Math.random() * Math.PI * 2
      return {
        ...prev,
        [bubbleId]: {
          ...bubble,
          vx: bubble.vx + Math.cos(angle) * force,
          vy: bubble.vy + Math.sin(angle) * force
        }
      }
    })
  }, [])

  // Function to add global disturbance
  const disturbAllBubbles = useCallback((force: number = 2) => {
    setPositions(prev => {
      const newPositions = { ...prev }
      Object.keys(newPositions).forEach(id => {
        const angle = Math.random() * Math.PI * 2
        newPositions[id] = {
          ...newPositions[id],
          vx: newPositions[id].vx + Math.cos(angle) * force,
          vy: newPositions[id].vy + Math.sin(angle) * force
        }
      })
      return newPositions
    })
  }, [])

  return {
    positions,
    center,
    disturbBubble,
    disturbAllBubbles
  }
}
