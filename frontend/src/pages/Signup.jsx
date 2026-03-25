import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import QuizContainer from '../components/OnboardingQuiz/QuizContainer'

function Signup() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)

  // Check if userName exists in localStorage and redirect if it does
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName')
    if (storedUserName) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSignup = (e) => {
    e.preventDefault()
    // Save userName to localStorage
    localStorage.setItem('userName', userName)
    // Save email to localStorage if needed
    if (email) {
      localStorage.setItem('userEmail', email)
    }
    // Show the quiz
    setShowQuiz(true)
  }

  const handleComplete = (sessionData) => {
    // Store session data in localStorage for persistence
    localStorage.setItem('sessionData', JSON.stringify(sessionData))
    
    // Navigate to dashboard
    navigate('/dashboard', { 
      state: { sessionData }
    })
  }

  // If quiz is shown, render the quiz container
  if (showQuiz) {
    return (
      <div className="min-h-screen">
        <QuizContainer onComplete={handleComplete} />
      </div>
    )
  }

  // Otherwise, show the signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-6">Let's get you started with personalized onboarding.</p>
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Signup
