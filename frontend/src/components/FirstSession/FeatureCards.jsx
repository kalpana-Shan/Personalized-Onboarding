import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RecommendationsPanel from './RecommendationsPanel'

// Feature definitions with icons and descriptions
const featureDetails = {
  code_editor: {
    icon: '💻',
    title: 'Code Editor',
    description: 'Write and edit code with syntax highlighting and auto-complete.',
  },
  project_templates: {
    icon: '📋',
    title: 'Project Templates',
    description: 'Start with pre-built templates to speed up your workflow.',
  },
  deployment: {
    icon: '🚀',
    title: 'One-Click Deployment',
    description: 'Deploy your project to production with a single click.',
  },
  feature_tour: {
    icon: '🎯',
    title: 'Feature Tour',
    description: 'Get a guided walkthrough of all available features.',
  },
  documentation: {
    icon: '📖',
    title: 'Documentation',
    description: 'Comprehensive docs to help you learn and reference.',
  },
  examples: {
    icon: '💡',
    title: 'Examples',
    description: 'Learn from real-world examples and code samples.',
  },
  courses: {
    icon: '🎓',
    title: 'Courses',
    description: 'Structured learning paths to master new skills.',
  },
  certifications: {
    icon: '🏆',
    title: 'Certifications',
    description: 'Earn certificates to validate your expertise.',
  },
  learning_paths: {
    icon: '🛤️',
    title: 'Learning Paths',
    description: 'Follow guided paths from beginner to expert.',
  },
  team_workspace: {
    icon: '👥',
    title: 'Team Workspace',
    description: 'Collaborate with your team in shared workspaces.',
  },
  shared_projects: {
    icon: '📁',
    title: 'Shared Projects',
    description: 'Share projects with your team members.',
  },
  comments: {
    icon: '💬',
    title: 'Comments',
    description: 'Leave comments and feedback on projects.',
  },
  invite_team: {
    icon: '✉️',
    title: 'Invite Team',
    description: 'Invite team members to collaborate.',
  },
  analytics_dashboard: {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Track your metrics and performance.',
  },
  integrations: {
    icon: '🔗',
    title: 'Integrations',
    description: 'Connect with your favorite tools.',
  },
  templates: {
    icon: '📋',
    title: 'Templates',
    description: 'Use templates for common use cases.',
  },
  quick_actions: {
    icon: '⚡',
    title: 'Quick Actions',
    description: 'Perform common actions with shortcuts.',
  },
  one_click_setup: {
    icon: '🔘',
    title: 'One-Click Setup',
    description: 'Get started in seconds with one click.',
  },
  getting_started: {
    icon: '🎬',
    title: 'Getting Started',
    description: 'Quick start guide to begin your journey.',
  },
  api_docs: {
    icon: '📚',
    title: 'API Docs',
    description: 'Complete API documentation for developers.',
  },
  advanced_settings: {
    icon: '⚙️',
    title: 'Advanced Settings',
    description: 'Fine-tune your experience with advanced options.',
  },
  customization: {
    icon: '🎨',
    title: 'Customization',
    description: 'Customize the look and feel of your workspace.',
  },
}

// Features mapped by persona
const featuresByPersona = {
  'slow-explorer': [
    { id: 'getting_started', name: 'intro_video', title: 'Intro Video', icon: '🎬' },
    { id: 'feature_tour', name: 'basic_guide', title: 'Basic Guide', icon: '📖' },
    { id: 'examples', name: 'simple_examples', title: 'Simple Examples', icon: '💡' },
  ],
  'fast-beginner': [
    { id: 'quick_actions', name: 'quick_start', title: 'Quick Start', icon: '⚡' },
    { id: 'one_click_setup', name: 'instant_setup', title: 'Instant Setup', icon: '🔘' },
    { id: 'project_templates', name: 'ready_templates', title: 'Ready Templates', icon: '📋' },
  ],
  'steady-builder': [
    { id: 'documentation', name: 'docs', title: 'Documentation', icon: '📖' },
    { id: 'examples', name: 'samples', title: 'Code Samples', icon: '💡' },
    { id: 'team_workspace', name: 'collab', title: 'Team Collaboration', icon: '👥' },
  ],
  'expert-builder': [
    { id: 'api_docs', name: 'api_reference', title: 'API Reference', icon: '📚' },
    { id: 'integrations', name: 'integrations', title: 'Integrations', icon: '🔗' },
    { id: 'advanced_settings', name: 'advanced_config', title: 'Advanced Config', icon: '⚙️' },
  ],
  'expert-explorer': [
    { id: 'api_docs', name: 'api_docs', title: 'API Docs', icon: '📚' },
    { id: 'integrations', name: 'integrations', title: 'Integrations', icon: '🔗' },
    { id: 'customization', name: 'customization', title: 'Customization', icon: '🎨' },
  ],
}

// Default features for unknown personas
const defaultFeatures = [
  { id: 'getting_started', name: 'getting_started', title: 'Getting Started', icon: '🎬' },
  { id: 'feature_tour', name: 'feature_tour', title: 'Feature Tour', icon: '🎯' },
  { id: 'documentation', name: 'documentation', title: 'Documentation', icon: '📖' },
]

function FeatureCards({ highlightFeatures = [], persona }) {
  const [showRecommendations, setShowRecommendations] = useState(false)

  // Get features based on persona, fallback to highlightFeatures or default
  const getFeatures = () => {
    if (persona && featuresByPersona[persona]) {
      return featuresByPersona[persona].map(f => ({
        id: f.id,
        name: f.name,
        icon: f.icon,
        title: f.title,
        description: featureDetails[f.id]?.description || 'Discover this feature.',
      }))
    }
    
    // Fall back to highlightFeatures from props
    if (highlightFeatures && highlightFeatures.length > 0) {
      return highlightFeatures.slice(0, 3).map(featureId => ({
        id: featureId,
        ...(featureDetails[featureId] || {
          icon: '✨',
          title: featureId,
          description: 'Discover this feature.',
        }),
      }))
    }
    
    // Final fallback to default features
    return defaultFeatures.map(f => ({
      id: f.id,
      name: f.name,
      icon: f.icon,
      title: f.title,
      description: featureDetails[f.id]?.description || 'Discover this feature.',
    }))
  }

  const features = getFeatures()

  if (features.length === 0) {
    return null
  }

  const handleExploreClick = () => {
    setShowRecommendations(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recommended for you
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <motion.button
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExploreClick}
            className="text-left p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-primary-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
            <div className="mt-3 text-primary-600 text-sm font-medium flex items-center gap-1">
              Explore <span>→</span>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showRecommendations && (
          <RecommendationsPanel 
            persona={persona} 
            onClose={() => setShowRecommendations(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FeatureCards
