import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import WelcomeBanner from '../components/FirstSession/WelcomeBanner'
import LearningCards from '../components/FirstSession/LearningCards'
import AdaptiveChecklist from '../components/FirstSession/AdaptiveChecklist'
import ContextualTooltip from '../components/FirstSession/ContextualTooltip'
import IdleRescuePrompt from '../components/Analytics/IdleRescuePrompt'
import useWebSocket from '../hooks/useWebSocket'

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sessionData, setSessionData] = useState(null)
  
  // Get session data from location state or localStorage
  useEffect(() => {
    const data = location.state?.sessionData || 
      JSON.parse(localStorage.getItem('sessionData') || 'null')
    
    if (!data) {
      // No session data, redirect to signup
      navigate('/signup')
      return
    }
    
    setSessionData(data)
  }, [location.state, navigate])

  // WebSocket for real-time analytics
  const { sendEvent, isConnected } = useWebSocket(sessionData?.session_id)

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollTop = window.scrollY
      const scrollDepth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0
      
      if (isConnected) {
        sendEvent('scroll', { depth: scrollDepth })
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isConnected, sendEvent])

  // Track page load
  useEffect(() => {
    if (isConnected && sessionData) {
      sendEvent('step_enter', { step: 'dashboard' })
    }
  }, [isConnected, sessionData, sendEvent])

  const handlePersonaReset = () => {
    // Reset and go back to signup
    localStorage.removeItem('sessionData')
    navigate('/signup')
  }

  if (!sessionData) {
    return null
  }

  const { session_config, goal, user_id } = sessionData
  const { 
    persona, 
    highlight_features, 
    content_tone, 
    first_task, 
    skip_modules 
  } = session_config

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Connection status indicator */}
        {isConnected && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <WelcomeBanner 
          goal={goal} 
          persona={persona}
        />

        {/* Learning Cards with AI Recommendations */}
        <LearningCards 
          sessionConfig={session_config}
        />

        {/* Adaptive Checklist */}
        <AdaptiveChecklist 
          firstTask={first_task}
          skipModules={skip_modules}
        />

        {/* Contextual Tooltip Example */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Need help?
          </h3>
          <div className="flex gap-4">
            <ContextualTooltip 
              content="Click here to access settings" 
              idleTimeout={5000}
            >
              <button className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
                ⚙️ Settings
              </button>
            </ContextualTooltip>
            
            <ContextualTooltip 
              content="Get help from our support team" 
              idleTimeout={5000}
            >
              <button className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
                ❓ Help
              </button>
            </ContextualTooltip>
          </div>
        </div>

        {/* Idle Rescue Prompt */}
        <IdleRescuePrompt 
          sessionId={user_id}
          persona={persona}
          onPersonaReset={handlePersonaReset}
        />
      </div>
    </div>
  )
}

export default Dashboard
