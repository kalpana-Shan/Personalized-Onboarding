import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useIdleDetector from '../../hooks/useIdleDetector'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * IdleRescuePrompt component that shows a rescue prompt when
 * the user is idle for 30 seconds.
 * 
 * @param {string} sessionId - The user's session ID
 * @param {string} persona - The current persona ID
 * @param {function} onPersonaReset - Callback when user switches persona
 */
function IdleRescuePrompt({ sessionId, persona, onPersonaReset }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  
  // Use 30 second timeout for page-level idle detection
  const { isIdle, resetIdle } = useIdleDetector(30000)

  // Show prompt when idle is detected
  useState(() => {
    if (isIdle && !showPrompt) {
      setShowPrompt(true)
    }
  }, [isIdle, showPrompt])

  const handleSwitchPersona = useCallback(async () => {
    try {
      // Send drop-off event
      await fetch(`${API_URL}/api/v1/analytics/drop-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: sessionId,
          persona,
          step: 1,
          time_spent: 30,
          idle_triggered: true,
          event_type: 'rescue_action',
        }),
      })

      setIsDismissing(true)
      
      // Trigger persona reset
      if (onPersonaReset) {
        onPersonaReset()
      }
    } catch (err) {
      console.error('Failed to record rescue action:', err)
    }
  }, [sessionId, persona, onPersonaReset])

  const handleContinue = useCallback(() => {
    resetIdle()
    setShowPrompt(false)
  }, [resetIdle])

  const handleSkip = useCallback(() => {
    setIsDismissing(true)
    setShowPrompt(false)
  }, [])

  return (
    <AnimatePresence>
      {showPrompt && !isDismissing && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🤔</div>
              <div className="flex-1">
                <p className="font-medium mb-2">
                  Stuck? Switch to a simpler path →
                </p>
                <p className="text-gray-400 text-sm mb-3">
                  It looks like you might need some help. Would you like a more guided experience?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSwitchPersona}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Switch to simpler path
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Skip this
                  </button>
                  <button
                    onClick={handleContinue}
                    className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    I'm fine
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default IdleRescuePrompt
