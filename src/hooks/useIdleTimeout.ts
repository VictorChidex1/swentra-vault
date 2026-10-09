import { useEffect, useRef } from 'react'

export function useIdleTimeout(onIdle: () => void, idleTimeMinutes = 15) {
  // Store the latest callback so we don't need to re-bind event listeners if it changes
  const onIdleRef = useRef(onIdle)
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  useEffect(() => {
    // Update the timestamp on user activity
    // This is extremely lightweight, preventing CPU thrashing on high-frequency events like mousemove.
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Events to track activity
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll'
    ]

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Check for idle state periodically (every 10 seconds)
    // This approach is much more robust than a single setTimeout because it handles 
    // system sleep/wake cycles perfectly. If a laptop sleeps for 20 mins, upon wake, 
    // this interval will fire, see the timestamp is 20 mins old, and immediately log them out.
    const intervalId = setInterval(() => {
      const now = Date.now()
      const idleTimeMs = idleTimeMinutes * 60 * 1000

      if (now - lastActivityRef.current >= idleTimeMs) {
        onIdleRef.current()
      }
    }, 10000)

    return () => {
      clearInterval(intervalId)
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [idleTimeMinutes])
}
