import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook to detect user idle state.
 * 
 * @param {number} timeout - Time in ms before considering user idle (default: 5000ms)
 * @returns {object} - { isIdle, resetIdle }
 */
function useIdleDetector(timeout = 5000) {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now()
    setIsIdle(false)
  }, [])

  const handleActivity = useCallback(() => {
    resetIdle()
  }, [resetIdle])

  useEffect(() => {
    // Set up event listeners for user activity
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ]

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Start the idle timer
    const checkIdle = () => {
      const elapsed = Date.now() - lastActivityRef.current
      
      if (elapsed >= timeout && !isIdle) {
        setIsIdle(true)
      } else if (elapsed < timeout && isIdle) {
        setIsIdle(false)
      }
    }

    // Check every second
    timerRef.current = setInterval(checkIdle, 1000)

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timeout, isIdle, handleActivity])

  return { isIdle, resetIdle }
}

export default useIdleDetector
