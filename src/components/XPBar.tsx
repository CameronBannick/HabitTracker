import { useEffect, useRef, useState } from 'react'

const SEGMENTS = 20

interface XPBarProps {
  progress: number // 0–1
  color: string
}

export function XPBar({ progress, color }: XPBarProps) {
  const target = Math.round(progress * SEGMENTS)
  const [count, setCount] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      if (target === 0) return
      let c = 0
      const tick = () => {
        c++
        setCount(c)
        if (c < target) setTimeout(tick, 35)
      }
      setTimeout(tick, 120)
    } else {
      setCount(target)
    }
  }, [target])

  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const filled = i < count
        return (
          <div
            key={i}
            className="h-[5px] flex-1 rounded-[1px] transition-colors duration-100"
            style={{
              backgroundColor: filled ? color : 'rgba(255,255,255,0.07)',
              boxShadow: filled ? `0 0 5px ${color}99` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
