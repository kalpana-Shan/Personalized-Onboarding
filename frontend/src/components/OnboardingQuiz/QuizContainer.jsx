import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Step1Goal from './Step1Goal'
import Step2Skill from './Step2Skill'
import Step3NLP from './Step3NLP'

const steps = [
  { id: 1, name: 'Goal' },
  { id: 2, name: 'Skill' },
  { id: 3, name: 'Success' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function QuizContainer({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [quizData, setQuizData] = useState({
    goal: null,
    skillLevel: 3,
    successText: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoalSelect = useCallback((goal) => {
    setQuizData(prev => ({ ...prev, goal }))
    setCurrentStep(2)
  }, [])

  const handleSkillSelect = useCallback((skillLevel) => {
    setQuizData(prev => ({ ...prev, skillLevel }))
    setCurrentStep(3)
  }, [])

  const handleSuccessSubmit = useCallback(async (successText) => {
    setQuizData(prev => ({ ...prev, successText }))
    setIsLoading(true)
    setError('')

    try {
      // Generate a unique user ID
      const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Detect device type
      const userAgent = navigator.userAgent.toLowerCase()
      let deviceType = 'desktop'
      if (/mobile|android|iphone/.test(userAgent)) {
        deviceType = 'mobile'
      } else if (/tablet|ipad/.test(userAgent)) {
        deviceType = 'tablet'
      }

      // Get UTM params from URL
      const urlParams = new URLSearchParams(window.location.search)
      const utmSource = urlParams.get('utm_source') || 'direct'
      const utmCampaign = urlParams.get('utm_campaign')

      const response = await fetch(`${API_URL}/api/v1/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Type': deviceType,
          'X-UTM-Source': utmSource,
          'X-UTM-Campaign': utmCampaign || '',
        },
        body: JSON.stringify({
          uid,
          goal: quizData.goal || 'explore',
          skill_level: quizData.skillLevel,
          success_text: successText,
          device_type: deviceType,
          utm_source: utmSource,
          utm_campaign: utmCampaign,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      const data = await response.json()
      
      // Call onComplete with the session config
      onComplete({
        ...data,
        goal: quizData.goal,
        skillLevel: quizData.skillLevel,
        successText,
      })
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [quizData, onComplete])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const progress = (currentStep / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  step.id <= currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? 'bg-primary-600 text-white'
                      : step.id === currentStep
                      ? 'bg-primary-100 border-2 border-primary-600 text-primary-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* Progress bar background */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiz steps */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <Step1Goal onSelect={handleGoalSelect} />
              )}
              {currentStep === 2 && (
                <Step2Skill
                  onSelect={handleSkillSelect}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <Step3NLP
                  onSubmit={handleSuccessSubmit}
                  onBack={handleBack}
                  isLoading={isLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default QuizContainer
