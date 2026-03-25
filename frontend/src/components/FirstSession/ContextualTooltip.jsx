import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useIdleDetector from '../../hooks/useIdleDetector'

/**
 * ContextualTooltip component that shows a tooltip after the user
 * is idle on a UI element for a specified time.
 * 
 * @param {React.ReactNode} children - The child component to wrap
 * @param {string} content - The tooltip content
 * @param {number} idleTimeout - Time in ms before showing tooltip (default: 5000)
 */
function ContextualTooltip({ children, content, idleTimeout = 5000 }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef(null)
  const { isIdle: globalIdle } = useIdleDetector(idleTimeout)
  const idleTimerRef = useRef(null)

  const handleMouseEnter = () => {
    setIsHovering(true)
    // Start local idle timer when hovering
    idleTimerRef.current = setTimeout(() => {
      if (isHovering) {
        setShowTooltip(true)
      }
    }, idleTimeout)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setShowTooltip(false)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
  }

  // Hide tooltip when global idle is detected (user left the page)
  useEffect(() => {
    if (globalIdle) {
      setShowTooltip(false)
    }
  }, [globalIdle])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2"
          >
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              {content}
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ContextualTooltip
