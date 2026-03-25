import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function WelcomeBanner({ goal, persona }) {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Read userName from localStorage, default to 'User' if not found
  const userName = useMemo(() => {
    return localStorage.getItem('userName') || 'User'
  }, [])

  // Read progress from localStorage
  const completedCount = useMemo(() => {
    const count = localStorage.getItem('completedResourcesCount')
    return count ? parseInt(count, 10) : 0
  }, [])

  const totalResources = 3
  const isSessionComplete = completedCount >= totalResources

  // Map goal to display text
  const goalText = {
    learn: 'to learn new tech skills',
    build: 'to build real projects',
    explore: 'to explore new technologies',
    collaborate: 'to collaborate with your team',
  }

  // AI Learning Coach persona greetings
  const coachGreetings = {
    'slow-explorer': `👨‍🏫 Hey ${userName}! I'm your learning coach. Let's take it step by step 🐢`,
    'fast-beginner': `⚡ Hey ${userName}! Your AI coach says let's move fast ⚡`,
    'steady-builder': `🔨 Hey ${userName}! Ready to build something great? Let's go!`,
    'expert-builder': `🚀 Hey ${userName}! Time to dive deep. Your AI coach has prepared something special 🚀`,
    'expert-explorer': `🌐 Hey ${userName}! Time to explore. Let's discover amazing things together!`,
  }

  const displayText = goalText[goal] || 'to get started'

  // Get the greeting based on persona, fallback to default
  const greeting = coachGreetings[persona] || `🎓 Welcome ${userName}! Your AI Learning Coach is ready to help`

  // Handle change preferences - clear localStorage and navigate to signup
  const handleChangePreferences = () => {
    localStorage.removeItem('userName')
    localStorage.removeItem('sessionData')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('completedResourcesCount')
    setShowConfirm(true)
    setTimeout(() => {
      navigate('/signup')
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white mb-6 relative"
    >
      {/* Change Preferences button */}
      <button
        onClick={handleChangePreferences}
        className="absolute top-4 right-4 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
      >
        Change Preferences
      </button>
      
      {/* Confirmation message */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 right-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          ✅ Preferences cleared. Starting fresh...
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
          🎓
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}
          </h1>
          <p className="text-indigo-100 mt-1">
            You're here {displayText}. Let's create your personalized learning journey!
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      {isSessionComplete ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 p-4 bg-green-500/30 rounded-xl text-center"
        >
          <span className="text-2xl">🎉</span>
          <p className="font-bold text-lg mt-1">Congratulations! Session Complete!</p>
          <p className="text-sm text-green-100">You've completed all your learning resources</p>
        </motion.div>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalResources) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <span className="text-sm text-white/80">{completedCount}/{totalResources} resources completed</span>
        </div>
      )}

      {/* Next session countdown */}
      <p className="text-sm text-indigo-200 mt-2">
        ⏰ Next learning session recommended in 2 hours
      </p>

      {/* Persona badge */}
      {persona && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Your learning style: <strong>{persona}</strong></span>
        </motion.div>
      )}
    </motion.div>
  )
}

export default WelcomeBanner
