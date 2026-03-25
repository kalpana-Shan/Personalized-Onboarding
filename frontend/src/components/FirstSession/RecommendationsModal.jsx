import { useState } from 'react'
import { motion } from 'framer-motion'

// Type badge configurations
const typeConfig = {
  video: { icon: '🎥', label: 'Video', color: 'bg-red-100 text-red-700' },
  notes: { icon: '📖', label: 'Notes', color: 'bg-blue-100 text-blue-700' },
  quiz: { icon: '❓', label: 'Quiz', color: 'bg-green-100 text-green-700' },
  flashcard: { icon: '📱', label: 'Flashcard', color: 'bg-purple-100 text-purple-700' },
}

function RecommendationsModal({ recommendations, onClose }) {
  const [selectedResource, setSelectedResource] = useState(null)

  const handleStartLearning = (rec) => {
    setSelectedResource(rec)
    // Trigger parent's resource modal
    window.dispatchEvent(new CustomEvent('openResource', { detail: rec }))
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🎓 Your Personalized Learning Plan
          </h2>
          <p className="text-gray-500 mt-1">
            Based on your goals, here are your AI-curated recommendations
          </p>
        </div>

        {/* Recommendations list */}
        <div className="p-6 space-y-4">
          {recommendations.map((rec, index) => {
            const config = typeConfig[rec.type] || typeConfig.video
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {/* Number */}
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                  <p className="text-sm text-gray-500">{rec.platform}</p>
                  <p className="text-sm text-gray-600 mt-1">{rec.why}</p>
                  
                  {/* Start Learning button */}
                  <button
                    onClick={() => handleStartLearning(rec)}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Start Learning →
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            Got it, start learning 🚀
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default RecommendationsModal
