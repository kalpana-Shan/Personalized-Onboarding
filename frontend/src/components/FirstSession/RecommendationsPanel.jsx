import { motion } from 'framer-motion'

// Dictionary mapping personas to specific, actionable text recommendations
const recommendationsByPersona = {
  'slow-explorer': [
    'Start with the intro video (2 minutes)',
    'Join the beginner community',
    'Follow the guided checklist',
  ],
  'fast-beginner': [
    'Launch a quick-start project template',
    'Enable keyboard shortcuts for faster navigation',
    'Try the one-click deployment feature',
  ],
  'steady-builder': [
    'Read the comprehensive documentation',
    'Explore the code examples repository',
    'Set up your team workspace',
  ],
  'expert-builder': [
    'Review the API documentation',
    'Set up advanced workspace integrations',
    'Configure your deployment settings',
  ],
  'expert-explorer': [
    'Browse the complete API reference',
    'Explore integration possibilities',
    'Customize your workspace configuration',
  ],
}

// Default recommendations for unknown personas
const defaultRecommendations = [
  'Explore the getting started guide',
  'Check out the feature tour',
  'Browse the documentation',
]

function RecommendationsPanel({ persona, onClose }) {
  const recommendations = recommendationsByPersona[persona] || defaultRecommendations

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recommendations for you
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="text-xl">✨</span>
            <span className="text-gray-700 font-medium">{item}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  )
}

export default RecommendationsPanel
