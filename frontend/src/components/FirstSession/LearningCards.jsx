import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RecommendationsModal from './RecommendationsModal'

// Type badge configurations
const typeConfig = {
  video: { icon: '🎥', label: 'Video', color: 'bg-red-100 text-red-700', buttonIcon: '▶️', mockContent: 'Video Player - Click play to start learning!' },
  notes: { icon: '📖', label: 'Notes', color: 'bg-blue-100 text-blue-700', buttonIcon: '📚', mockContent: 'Documentation - Reading material...' },
  quiz: { icon: '❓', label: 'Quiz', color: 'bg-green-100 text-green-700', buttonIcon: '✅', mockContent: 'Interactive Quiz - Test your knowledge!' },
  flashcard: { icon: '📱', label: 'Flashcard', color: 'bg-purple-100 text-purple-700', buttonIcon: '🎴', mockContent: 'Flashcard Deck - Swipe to learn!' },
}

// Default learning recommendations for when none come from backend
const defaultRecommendations = [
  { type: 'video', title: 'Getting Started with Your Goal', platform: 'YouTube', link: '#', why: 'Perfect introduction' },
  { type: 'notes', title: 'Official Documentation', platform: 'Docs', link: '#', why: 'Comprehensive reference' },
  { type: 'quiz', title: 'Practice Quiz', platform: 'LeetCode', link: '#', why: 'Test your knowledge' },
]

// Resource Modal Component
function ResourceModal({ resource, onClose, onComplete }) {
  const config = typeConfig[resource.type] || typeConfig.video
  const [isOpen, setIsOpen] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  
  // Video progress state
  const [videoProgress, setVideoProgress] = useState(0)
  
  // Notes expanded sections
  const [expandedSections, setExpandedSections] = useState({})
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  
  // Fake quiz questions
  const quizQuestions = [
    { id: 1, question: "What is the main goal of this learning module?", options: ["Build a project", "Pass a test", "Explore features", "Collaborate with team"], correct: 0 },
    { id: 2, question: "Which approach is recommended for beginners?", options: ["Skip the basics", "Start with fundamentals", "Go straight to advanced", "Read all docs first"], correct: 1 },
    { id: 3, question: "How should you practice?", options: ["Only reading", "Only watching", "Hands-on practice", "Memorizing everything"], correct: 2 },
  ]

  const handleOpenContent = () => {
    setIsOpen(true)
    
    // Start video progress simulation
    if (resource.type === 'video') {
      const interval = setInterval(() => {
        setVideoProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 5
        })
      }, 500)
    }
  }

  const handleMarkComplete = () => {
    setIsComplete(true)
    onComplete(resource)
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const handleQuizAnswer = (questionId, answerIndex) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleQuizSubmit = () => {
    let score = 0
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) score++
    })
    setQuizScore(score)
    setQuizSubmitted(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText("# Learning Notes\n\n## Section 1\nContent here...\n\n## Section 2\nMore content...")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{resource.title}</h2>
          <p className="text-gray-500">{resource.platform}</p>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {!isOpen ? (
            <div className="text-center">
              <div className="text-6xl mb-4">{config.icon}</div>
              <p className="text-gray-600 mb-6">{resource.why}</p>
              <button
                onClick={handleOpenContent}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {config.buttonIcon} Open {config.label}
              </button>
            </div>
          ) : (
            <div>
              {/* VIDEO CONTENT */}
              {resource.type === 'video' && (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-xl p-8 text-white text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-xl font-bold mb-2">Agentic AI Intro - 8 minutes</h3>
                    <p className="text-gray-400 mb-6">Click play to start watching</p>
                    <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-400">{videoProgress}% complete</p>
                    <button className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full text-xl">
                      ▶ Play
                    </button>
                  </div>
                </div>
              )}

              {/* NOTES CONTENT */}
              {resource.type === 'notes' && (
                <div className="space-y-3">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    📋 Copy to Clipboard
                  </button>
                  
                  {[
                    { id: 1, title: "Getting Started", content: "Welcome to this learning module. Here you'll find comprehensive notes to help you master the concepts." },
                    { id: 2, title: "Key Concepts", content: "• Concept 1: Fundamentals\n• Concept 2: Best Practices\n• Concept 3: Common Patterns" },
                    { id: 3, title: "Practice Exercises", content: "Try these exercises to solidify your understanding: 1) Build a simple project, 2) Debug common issues, 3) Review the documentation" },
                  ].map(section => (
                    <div key={section.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50"
                      >
                        <span className="font-medium">{section.title}</span>
                        <span>{expandedSections[section.id] ? '▲' : '▼'}</span>
                      </button>
                      {expandedSections[section.id] && (
                        <div className="p-4 bg-gray-50 border-t">
                          <pre className="whitespace-pre-wrap text-sm">{section.content}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* QUIZ CONTENT */}
              {resource.type === 'quiz' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Test Your Knowledge</h3>
                  {quizQuestions.map((q, idx) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => {
                          const isSelected = quizAnswers[q.id] === optIdx
                          const isCorrect = quizSubmitted && optIdx === q.correct
                          const isWrong = quizSubmitted && isSelected && optIdx !== q.correct
                          
                          return (
                            <button
                              key={optIdx}
                              onClick={() => !quizSubmitted && handleQuizAnswer(q.id, optIdx)}
                              disabled={quizSubmitted}
                              className={`w-full p-3 text-left rounded-lg border transition-colors ${
                                isCorrect ? 'bg-green-100 border-green-500' :
                                isWrong ? 'bg-red-100 border-red-500' :
                                isSelected ? 'bg-primary-100 border-primary-500' :
                                'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {option}
                              {isCorrect && ' ✓'}
                              {isWrong && ' ✗'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < 3}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl mb-2">{quizScore === 3 ? '🎉' : '📝'}</p>
                      <p className="font-bold text-green-700">
                        {quizScore === 3 ? 'Perfect! 100%' : `${quizScore}/3 correct (${Math.round(quizScore/3*100)}%)`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* FLASHCARD CONTENT */}
              {resource.type === 'flashcard' && (
                <div className="text-center">
                  <div className="bg-purple-50 p-8 rounded-xl mb-4">
                    <p className="text-2xl font-bold text-purple-900">Coming Soon</p>
                    <p className="text-purple-600">Flashcard deck feature</p>
                  </div>
                </div>
              )}
              
              {/* Completion button */}
              {(resource.type === 'video' || resource.type === 'notes' || (resource.type === 'quiz' && quizSubmitted)) && (
                isComplete ? (
                  <div className="mt-6 py-3 px-4 bg-green-100 text-green-700 rounded-xl font-medium flex items-center justify-center gap-2">
                    ✅ Completed!
                  </div>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    className="mt-6 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    ✓ Mark as Complete
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LearningCards({ sessionConfig }) {
  const [showModal, setShowModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [completedResources, setCompletedResources] = useState(new Set())
  
  // Get learning recommendations from sessionConfig
  const recommendations = sessionConfig?.learning_recommendations?.length > 0
    ? sessionConfig.learning_recommendations
    : defaultRecommendations

  const handleExploreClick = () => {
    setShowModal(true)
  }

  const handleResourceClick = (resource) => {
    setSelectedResource(resource)
    setShowResourceModal(true)
  }

  const handleResourceComplete = (resource) => {
    setCompletedResources(prev => {
      const newSet = new Set([...prev, resource.title])
      // Update localStorage count
      localStorage.setItem('completedResourcesCount', newSet.size.toString())
      return newSet
    })
    
    // Send to backend /track endpoint
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}')
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: sessionData.user_id || 'anonymous',
        resource: resource.title,
        type: resource.type,
        status: 'completed',
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => console.log('Track error:', err))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        🎯 Your AI Learning Path
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.slice(0, 3).map((rec, index) => {
          const config = typeConfig[rec.type] || typeConfig.video
          const isCompleted = completedResources.has(rec.title)
          
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResourceClick(rec)}
              className={`text-left p-4 bg-white rounded-xl border-2 transition-all duration-200 ${
                isCompleted 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-100 hover:border-primary-500 hover:shadow-lg'
              }`}
            >
              {/* Completion badge */}
              {isCompleted && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium mb-2">
                  ✅ Completed
                </div>
              )}
              
              {/* Type badge */}
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.color} mb-2`}>
                {config.icon} {config.label}
              </span>
              
              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
              
              {/* Platform */}
              <p className="text-sm text-gray-500 mb-2">{rec.platform}</p>
              
              {/* Why */}
              <p className="text-sm text-gray-600 mb-3">{rec.why}</p>
              
              {/* Action button */}
              <div className={`mt-auto text-sm font-medium flex items-center gap-1 ${
                isCompleted ? 'text-green-600' : 'text-primary-600'
              }`}>
                {isCompleted ? 'Review Again' : 'Start Learning'} {config.buttonIcon} <span>→</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <RecommendationsModal 
            recommendations={recommendations}
            onClose={() => setShowModal(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResourceModal && selectedResource && (
          <ResourceModal 
            resource={selectedResource}
            onClose={() => setShowResourceModal(false)}
            onComplete={handleResourceComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default LearningCards
