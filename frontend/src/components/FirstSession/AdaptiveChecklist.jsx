import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Available tasks
const allTasks = [
  { id: 'create_project', label: 'Create your first project', required: true },
  { id: 'invite_team', label: 'Invite team members', required: false },
  { id: 'setup_profile', label: 'Set up your profile', required: false },
  { id: 'connect_integration', label: 'Connect an integration', required: false },
  { id: 'explore_features', label: 'Explore features', required: false },
  { id: 'configure_settings', label: 'Configure settings', required: false },
  { id: 'quick_start', label: 'Quick start guide', required: false },
  { id: 'watch_tutorial', label: 'Watch a tutorial', required: false },
]

function AdaptiveChecklist({ firstTask, skipModules = [] }) {
  const [completedTasks, setCompletedTasks] = useState(() => {
    // Pre-select the first_task
    return firstTask ? [firstTask] : []
  })

  // Filter out skipped modules
  const availableTasks = allTasks.filter(task => !skipModules.includes(task.id))

  // Sort tasks: required/first_task first, then others
  const sortedTasks = [...availableTasks].sort((a, b) => {
    if (a.id === firstTask) return -1
    if (b.id === firstTask) return 1
    if (a.required && !b.required) return -1
    if (!a.required && b.required) return 1
    return 0
  })

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const progress = (completedTasks.length / sortedTasks.length) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl border-2 border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Your onboarding checklist
        </h2>
        <span className="text-sm text-gray-500">
          {completedTasks.length}/{sortedTasks.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Task list */}
      <div className="space-y-2">
        <AnimatePresence>
          {sortedTasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id)
            const isFirstTask = task.id === firstTask

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : isFirstTask
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                }`}
                onClick={() => toggleTask(task.id)}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-colors ${
                  isCompleted
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}>
                  {isCompleted && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white text-sm"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                {/* Task label */}
                <span className={`flex-1 ${
                  isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}>
                  {task.label}
                </span>

                {/* First task badge */}
                {isFirstTask && !isCompleted && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    First
                  </span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* All done message */}
      <AnimatePresence>
        {completedTasks.length === sortedTasks.length && sortedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 rounded-lg text-center"
          >
            <span className="text-green-600 font-medium">
              🎉 All done! You're ready to go.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AdaptiveChecklist
