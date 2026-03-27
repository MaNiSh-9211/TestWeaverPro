import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTest } from '../contexts/TestContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  Play, 
  Globe, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Zap,
  Code,
  Server,
  MessageCircle,
  Bot,
  Users,
  Brain,
  ArrowRightCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const testSchema = z.object({
  userStory: z.string()
    .min(10, 'User story must be at least 10 characters')
    .max(500, 'User story must be less than 500 characters'),
  url: z.string()
    .url('Please enter a valid URL')
    .min(1, 'URL is required')
})

const TestForm = () => {
  const { executeTest, loading, currentTest } = useTest()
  const { isAuthenticated } = useAuth()
  const [isExecuting, setIsExecuting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      userStory: 'As a user I want to login with username: test@example.com and password: 123456',
      url: 'https://example.com'
    }
  })

  const userStoryValue = watch('userStory')

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('Please login to execute tests')
      return
    }

    setIsExecuting(true)
    
    try {
      const result = await executeTest(data.userStory, data.url)
      
      if (result.success) {
        toast.success('Test executed successfully!')
        // Reset form after successful execution
        reset()
      } else {
        toast.error(result.error || 'Test execution failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsExecuting(false)
    }
  }

  const exampleStories = [
    "As a user I want to login with username: admin@test.com and password: admin123",
    "As a user I want to fill out the contact form with my details and submit it",
    "As a user I want to search for products and add them to my cart",
    "As a user I want to navigate to the about page and read the content"
  ]

  const runtimes = [
    {
      name: "Django",
      description: "High-level Python web framework",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-plain.svg"
    },
    {
      name: "Node.js",
      description: "JavaScript runtime for server-side development",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg"
    },
    {
      name: "Spring Boot",
      description: "Java-based microservices framework",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg"
    }
  ]


  return (
    <section className="py-20 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-black"></div>
      
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          {/* Runtime Support Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary mb-6">
              <Server className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                Runtime Support
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              <span className="gradient-text">Multi-Platform Support</span>
              <br />
              <span className="text-white">Test Any Technology Stack</span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Our AI engines seamlessly integrate with the most popular web frameworks and runtimes, 
              providing comprehensive testing coverage across different technology stacks.
            </p>

            {/* Runtime Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {runtimes.map((runtime, index) => (
                <motion.div
                  key={runtime.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-primary rounded-2xl p-8 text-center group hover:scale-105 transition-all duration-300"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-xl glass-primary flex items-center justify-center group-hover:scale-110 transition-transform p-4">
                    <img 
                      src={runtime.logo} 
                      alt={`${runtime.name} logo`}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{runtime.name}</h3>
                  <p className="text-gray-400 text-lg">{runtime.description}</p>
                </motion.div>
              ))}
            </div>
          </div>


          {/* AI Test Generation Section - COMMENTED OUT */}
          {/*
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary mb-6">
              <Zap className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                AI Test Generation
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              <span className="gradient-text">Autonomous Testing</span>
              <br />
              <span className="text-white">Zero Human Intervention</span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Describe what you want to test in natural language, and our autonomous AI engines will handle everything from data collection to bug fixes and deployment.
            </p>
          </div>

          {/* Main Form Card */}
          {/*
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="card-glass p-8 md:p-12 max-w-4xl mx-auto"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* URL Input */}
              {/*
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Globe className="w-5 h-5 text-white" />
                  Target URL
                </label>
                <input
                  {...register('url')}
                  type="url"
                  placeholder="https://your-website.com"
                  className="input-glass w-full text-lg"
                />
                {errors.url && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.url.message}
                  </p>
                )}
              </div>

              {/* User Story Input */}
              {/*
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-white">
                  <FileText className="w-5 h-5 text-white" />
                  User Story
                </label>
                <textarea
                  {...register('userStory')}
                  rows={4}
                  placeholder="As a user I want to..."
                  className="input-glass w-full text-lg resize-none"
                />
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Describe the test scenario in natural language</span>
                  <span>{userStoryValue?.length || 0}/500</span>
                </div>
                {errors.userStory && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.userStory.message}
                  </p>
                )}
              </div>

              {/* Example Stories */}
              {/*
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Example Stories
                </h4>
                <div className="grid gap-2">
                  {exampleStories.map((story, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('textarea[name="userStory"]')
                        if (textarea) {
                          textarea.value = story
                          textarea.dispatchEvent(new Event('input', { bubbles: true }))
                        }
                      }}
                      className="text-left p-3 rounded-lg glass-dark hover:glass-primary transition-all duration-300 text-sm text-gray-300 hover:text-white"
                    >
                      {story}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              {/*
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isExecuting || loading}
                  className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isExecuting || loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Executing Test...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Play className="w-5 h-5" />
                      Execute Test
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Authentication Notice */}
            {/*
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-lg glass-dark border border-white/20"
              >
                <div className="flex items-center gap-2 text-white">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Authentication Required</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  Please login or register to execute tests and access advanced features.
                </p>
              </motion.div>
            )}
          </motion.div>
          */}

          {/* Test Results Preview - Keep this section active */}
          {currentTest && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-8 card-glass p-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-white">Test Results</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Test ID</h4>
                  <p className="text-white font-mono text-sm">{currentTest.testId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentTest.status === 'passed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {currentTest.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Duration</h4>
                  <p className="text-white">{currentTest.duration}ms</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Steps</h4>
                  <p className="text-white">{currentTest.steps} steps executed</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default TestForm
