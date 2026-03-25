import { motion } from 'framer-motion'

const goals = [
  {
    id: 'learn',
    label: 'Learn',
    icon: '📚',
    description: 'I want to learn new skills',
  },
  {
    id: 'build',
    label: 'Build',
    icon: '🔨',
    description: 'I want to build something',
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: '🧭',
    description: 'I want to explore the platform',
  },
  {
    id: 'collaborate',
    label: 'Collaborate',
    icon: '🤝',
    description: 'I want to work with my team',
  },
]

function Step1Goal({ onSelect }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What brings you here today?
        </h2>
        <p className="text-gray-600">
          Select the option that best describes your goal
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {goals.map((goal, index) => (
          <motion.button
            key={goal.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(goal.id)}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-primary-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <span className="text-4xl mb-3">{goal.icon}</span>
            <span className="font-semibold text-gray-900">{goal.label}</span>
            <span className="text-xs text-gray-500 mt-1 text-center">
              {goal.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default Step1Goal
