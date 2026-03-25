import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const skillLabels = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Novice' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
]

function Step2Skill({ onSelect, onBack }) {
  const [skillLevel, setSkillLevel] = useState(3)
  const sliderRef = useRef(null)

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value, 10)
    setSkillLevel(value)
  }

  const handleContinue = () => {
    onSelect(skillLevel)
  }

  // Calculate thumb position for label
  const thumbPosition = ((skillLevel - 1) / 4) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What's your experience level?
        </h2>
        <p className="text-gray-600">
          This helps us personalize your experience
        </p>
      </motion.div>

      <div className="bg-white rounded-xl border-2 border-gray-100 p-8">
        {/* Current level display */}
        <div className="text-center mb-8">
          <motion.span
            key={skillLevel}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold text-primary-600"
          >
            {skillLevel}
          </motion.span>
          <p className="text-lg font-medium text-gray-700 mt-2">
            {skillLabels.find(s => s.value === skillLevel)?.label}
          </p>
        </div>

        {/* Slider */}
        <div className="relative mb-8">
          <input
            ref={sliderRef}
            type="range"
            min="1"
            max="5"
            value={skillLevel}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          
          {/* Animated label following thumb */}
          <motion.div
            className="absolute -top-12 transform -translate-x-1/2"
            animate={{ left: `${thumbPosition}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-primary-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
              {skillLabels.find(s => s.value === skillLevel)?.label}
            </div>
          </motion.div>
        </div>

        {/* Level labels */}
        <div className="flex justify-between px-2">
          {skillLabels.map((label) => (
            <div
              key={label.value}
              className={`text-sm ${
                skillLevel >= label.value
                  ? 'text-primary-600 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {label.label}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default Step2Skill
