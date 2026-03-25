import { useState } from 'react'
import { motion } from 'framer-motion'

const MAX_CHARS = 300

function Step3NLP({ onSubmit, onBack, isLoading }) {
  const [successText, setSuccessText] = useState('')
  const [error, setError] = useState('')

  const handleTextChange = (e) => {
    const text = e.target.value
    if (text.length <= MAX_CHARS) {
      setSuccessText(text)
      setError('')
    }
  }

  const handleSubmit = () => {
    if (!successText.trim()) {
      setError('Please describe what success looks like for you')
      return
    }
    onSubmit(successText)
  }

  const charCount = successText.length
  const isNearLimit = charCount > MAX_CHARS * 0.8

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Describe your ideal outcome
        </h2>
        <p className="text-gray-600">
          What does success look like for you? This helps us personalize your experience.
        </p>
      </motion.div>

      <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
        <textarea
          value={successText}
          onChange={handleTextChange}
          placeholder="Describe what success looks like for you... e.g., I want to build my first web app in a week"
          className={`w-full h-40 p-4 border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
          disabled={isLoading}
        />
        
        {/* Character counter */}
        <div className="flex justify-end mt-2">
          <span className={`text-sm ${isNearLimit ? 'text-orange-500' : 'text-gray-400'}`}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 font-medium mb-2">💡 Tips:</p>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>Be specific about what you want to achieve</li>
          <li>Mention your timeframe if you have one</li>
          <li>Think about what success would feel like</li>
        </ul>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || charCount === 0}
          className="px-8 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              </span>
              Processing...
            </>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  )
}

export default Step3NLP
