import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTest } from '../contexts/TestContext'
import { 
  BarChart3, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Zap,
  Brain,
  Shield
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const { tests, loading } = useTest()

  const stats = [
    {
      title: 'Total Tests',
      value: tests.length,
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-white/10'
    },
    {
      title: 'Passed Tests',
      value: tests.filter(test => test.status === 'passed').length,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Failed Tests',
      value: tests.filter(test => test.status === 'failed').length,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Success Rate',
      value: tests.length > 0 ? `${Math.round((tests.filter(test => test.status === 'passed').length / tests.length) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ]

  const recentTests = tests.slice(0, 5)

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-400 text-lg">
            Here's what's happening with your tests
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-glass p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stat.title}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Tests */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="card-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Recent Tests
                </h2>
                <button className="btn-glass px-4 py-2 text-sm">
                  View All
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : recentTests.length > 0 ? (
                <div className="space-y-4">
                  {recentTests.map((test, index) => (
                    <div
                      key={test.testId}
                      className="flex items-center justify-between p-4 rounded-lg glass-dark hover:glass-primary transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          test.status === 'passed' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {test.userStory?.substring(0, 50)}...
                          </p>
                          <p className="text-gray-400 text-xs">
                            {test.url}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          test.status === 'passed' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {test.status}
                        </div>
                        <div className="text-xs text-gray-400">
                          {test.duration}ms
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No tests yet</p>
                  <p className="text-sm text-gray-500">Create your first test to get started</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            {/* Quick Test */}
            <div className="card-glass p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Test
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Run a quick test on any website
              </p>
              <button className="btn-primary w-full">
                <Play className="w-4 h-4 mr-2" />
                Start New Test
              </button>
            </div>

            {/* Features */}
            <div className="card-glass p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg glass-primary flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">AI-Powered</p>
                    <p className="text-gray-400 text-xs">Smart test generation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg glass-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Fast Execution</p>
                    <p className="text-gray-400 text-xs">Lightning quick tests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg glass-primary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Secure</p>
                    <p className="text-gray-400 text-xs">Enterprise security</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
