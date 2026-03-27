import { motion } from 'framer-motion'
import { useState } from 'react'
import { Sparkles, Zap, Shield, Brain, ArrowRight, Play, ArrowRightIcon, FileText, X, Settings, Cpu, Database, MessageCircle, Bot, Users, ArrowRightCircle } from 'lucide-react'

// Arrow Component for better positioning
const CycleArrow = ({ delay, className, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Cycle Step Component
const CycleStep = ({ icon: Icon, title, engine, description, delay, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay }}
    className={`flex flex-col items-center text-center ${className}`}
  >
    <div className="w-20 h-20 rounded-full glass-primary flex items-center justify-center mb-4 group hover:scale-110 transition-transform">
      <Icon className="w-10 h-10 text-white" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 mb-2">{engine}</p>
    <p className="text-xs text-gray-500">{description}</p>
  </motion.div>
)

// Engine Detail Modal Component
const EngineDetailModal = ({ isOpen, onClose, engine }) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-black/90 border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl glass-primary flex items-center justify-center">
              {engine.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{engine.name}</h2>
              <p className="text-gray-400">{engine.engine}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg glass-primary hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
            <p className="text-gray-300 leading-relaxed">{engine.overview}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
            <ul className="space-y-2">
              {engine.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Technical Capabilities</h3>
            <p className="text-gray-300 leading-relaxed">{engine.technical}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Engine Card Component
const EngineCard = ({ engine, onViewDetail }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="glass-primary rounded-2xl p-6 text-center group hover:scale-105 transition-all duration-300"
  >
    <div className="w-24 h-24 mx-auto mb-4 rounded-xl glass-primary flex items-center justify-center group-hover:scale-110 transition-transform">
      {engine.icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{engine.name}</h3>
    <p className="text-gray-400 mb-4">{engine.engine}</p>
    <p className="text-sm text-gray-300 mb-6 leading-relaxed">{engine.description}</p>
    <button
      onClick={() => onViewDetail(engine)}
      className="btn-primary w-full group-hover:scale-105 transition-transform"
    >
      View Detail
    </button>
  </motion.div>
)

const Hero = () => {
  const [selectedEngine, setSelectedEngine] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const engines = [
    {
      name: "TestWeaver Harvex Engine",
      engine: "Data Collection Engine",
      description: "Automatically collects failure data, identifies broken functions, and generates test cases with zero human intervention.",
      icon: <Database className="w-12 h-12 text-white" />,
      overview: "The Harvex Engine is our advanced data collection and analysis system that operates continuously in the background, monitoring application health and automatically detecting issues before they impact users.",
      features: [
        "Real-time application monitoring and health checks",
        "Automatic failure detection and root cause analysis",
        "Intelligent data collection from multiple sources",
        "Machine learning-powered anomaly detection",
        "Zero-configuration setup and deployment",
        "Comprehensive logging and audit trails"
      ],
      technical: "Built on a distributed microservices architecture with advanced machine learning algorithms, the Harvex Engine can process millions of data points per second while maintaining sub-millisecond response times. It integrates seamlessly with existing monitoring tools and provides detailed insights into application performance."
    },
    {
      name: "TestWeaver Test Engine", 
      engine: "AI Testing Engine",
      description: "Executes AI-powered tests, generates comprehensive reports, and validates fixes autonomously.",
      icon: <Cpu className="w-12 h-12 text-white" />,
      overview: "Our Test Engine leverages cutting-edge AI technology to automatically generate, execute, and manage comprehensive test suites. It adapts to your application's unique characteristics and continuously improves test coverage.",
      features: [
        "AI-powered test case generation from user stories",
        "Automated test execution across multiple environments",
        "Intelligent test prioritization and optimization",
        "Cross-browser and cross-device testing",
        "Performance and load testing capabilities",
        "Detailed test reporting and analytics"
      ],
      technical: "The Test Engine uses advanced natural language processing to understand requirements and generate relevant test cases. It employs machine learning algorithms to optimize test execution order and identify the most critical test scenarios, ensuring maximum coverage with minimal execution time."
    },
    {
      name: "TestWeaver Defix Engine",
      engine: "Auto-Fix Engine",
      description: "Automatically debugs, fixes code, deploys changes, and verifies fixes in production - fully autonomous.",
      icon: <Settings className="w-12 h-12 text-white" />,
      overview: "The Defix Engine represents the pinnacle of autonomous software maintenance. It can analyze code issues, implement fixes, deploy changes, and verify solutions without any human intervention, making it the most advanced self-healing system available.",
      features: [
        "Automatic code analysis and bug detection",
        "AI-powered code generation and fixes",
        "Automated deployment and rollback capabilities",
        "Real-time production monitoring and validation",
        "Version control and change management",
        "Comprehensive fix verification and testing"
      ],
      technical: "Built on advanced static analysis, dynamic analysis, and machine learning techniques, the Defix Engine can understand complex codebases and implement fixes that maintain code quality and architectural integrity. It includes sophisticated deployment pipelines with automatic rollback capabilities and comprehensive monitoring."
    }
  ]

  const handleViewDetail = (engine) => {
    setSelectedEngine(engine)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEngine(null)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Engine Background Shapes */}
      <div className="engine-shapes">
        <div className="engine-shape-1"></div>
        <div className="engine-shape-2"></div>
        <div className="engine-shape-3"></div>
        <div className="engine-shape-4"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-6xl mx-auto">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary mb-6">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                Next-Gen Test Automation
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-bold mb-6">
              <span className="gradient-text text-shadow-lg">
                TestWeaver
              </span>
            </h1>
            
            <div className="text-2xl md:text-3xl text-white mb-8 font-semibold">
              Join the TestWeaver Ecosystem with AI Powered Cloud-native Engines
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Fully automated testing ecosystem with zero human intervention
              <br />
              <span className="text-lg text-gray-400">
                From data collection to test and verify the issue, bug fixes and deployment - completely autonomous
              </span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button className="btn-primary text-lg px-8 py-4 group">
              <span className="flex items-center gap-2">
                Start Testing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button className="btn-glass text-lg px-8 py-4 group">
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </span>
            </button>
          </motion.div>

          {/* Engines Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-6xl mx-auto mb-20"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary mb-6">
                <Settings className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">
                  AI-Powered Engines
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                <span className="gradient-text">Three Powerful Engines</span>
                <br />
                <span className="text-white">Working in Perfect Harmony</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Each engine specializes in a specific aspect of the testing lifecycle, 
                working together to create a fully autonomous testing ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {engines.map((engine, index) => (
                <EngineCard
                  key={engine.name}
                  engine={engine}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          </motion.div>

          {/* Multi-Agent Customer Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="max-w-6xl mx-auto mb-20"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary mb-6">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">
                  Multi-Agent Customer Support
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                <span className="gradient-text">Intelligent Chatbots</span>
                <br />
                <span className="text-white">Seamlessly Integrated with Harvex Engine</span>
              </h2>
              
              <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-12">
                Our advanced multi-agent chatbot system understands customer conversations, 
                identifies issues and bugs, and automatically triggers the complete testing cycle 
                through the Harvex Engine - all without human intervention.
              </p>

              {/* Chatbot Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
                {[
                  {
                    icon: <MessageCircle className="w-8 h-8 text-blue-400" />,
                    title: "Natural Language Processing",
                    description: "Understands user issues in plain English and converts them to actionable test scenarios"
                  },
                  {
                    icon: <Bot className="w-8 h-8 text-green-400" />,
                    title: "Multi-Agent Intelligence",
                    description: "Multiple specialized chatbots work together to analyze, categorize, and prioritize issues"
                  },
                  {
                    icon: <Brain className="w-8 h-8 text-purple-400" />,
                    title: "Harvex Engine Integration",
                    description: "Seamlessly triggers the autonomous testing cycle based on conversation analysis"
                  },
                  {
                    icon: <Users className="w-8 h-8 text-orange-400" />,
                    title: "24/7 Customer Support",
                    description: "Provides instant responses and automatically initiates testing workflows for reported issues"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-primary rounded-xl p-6 text-center group hover:scale-105 transition-all duration-300"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl glass-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Integration Flow */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="glass-primary rounded-2xl p-8 max-w-4xl mx-auto"
              >
                <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-primary flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Customer Reports Issue</h4>
                    <p className="text-sm text-gray-400">User describes problem in natural language through chat</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRightCircle className="w-8 h-8 text-white/60" />
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-primary flex items-center justify-center">
                      <Brain className="w-8 h-8 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Harvex Engine Triggers</h4>
                    <p className="text-sm text-gray-400">AI analyzes conversation and initiates testing cycle</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-lg glass-dark">
                  <p className="text-sm text-gray-300 text-center">
                    <strong className="text-white">Result:</strong> Complete autonomous testing, bug fixing, and deployment 
                    based on customer conversation - zero human intervention required.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Automated Cycle Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-7xl mx-auto mb-16"
          >
            <div className="relative">
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                {/* Cycle Steps - Horizontal Layout */}
                <div className="flex items-center justify-center relative gap-4">
                  {/* Step 1: Issue Detection */}
                  <CycleStep
                    icon={Brain}
                    title="Issue Detection"
                    engine="Harvex Engine"
                    description="User reports or auto-detects malfunction"
                    delay={0.6}
                    className="flex-shrink-0"
                  />

                  {/* Arrow 1 */}
                  <CycleArrow delay={1.1} className="flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-white/70" />
                  </CycleArrow>

                  {/* Step 2: Test Generation and Execution */}
                  <CycleStep
                    icon={Zap}
                    title="Test Generation and Execution"
                    engine="Test Engine"
                    description="AI-powered test creation & execution"
                    delay={0.7}
                    className="flex-shrink-0"
                  />

                  {/* Arrow 2 */}
                  <CycleArrow delay={1.2} className="flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-white/70" />
                  </CycleArrow>

                  {/* Step 3: Bug Fix */}
                  <CycleStep
                    icon={Shield}
                    title="Bug Fix"
                    engine="Defix Engine"
                    description="Auto debug & fix code"
                    delay={0.8}
                    className="flex-shrink-0"
                  />

                  {/* Arrow 3 */}
                  <CycleArrow delay={1.3} className="flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-white/70" />
                  </CycleArrow>

                  {/* Step 4: Re-test */}
                  <CycleStep
                    icon={Zap}
                    title="Re-test"
                    engine="Test Engine"
                    description="Validate fix works properly"
                    delay={0.9}
                    className="flex-shrink-0"
                  />

                  {/* Arrow 4 */}
                  <CycleArrow delay={1.4} className="flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-white/70" />
                  </CycleArrow>

                  {/* Step 5: Deployment */}
                  <CycleStep
                    icon={Play}
                    title="Deployment"
                    engine="Defix Engine"
                    description="Auto deploy to production"
                    delay={1.0}
                    className="flex-shrink-0"
                  />

                  {/* Arrow 5 */}
                  <CycleArrow delay={1.5} className="flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-white/70" />
                  </CycleArrow>

                  {/* Step 6: Detailed Report */}
                  <CycleStep
                    icon={FileText}
                    title="Detailed Report"
                    engine="All Engines"
                    description="Summary of changes and tests performed"
                    delay={1.1}
                    className="flex-shrink-0"
                  />
                </div>

              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden space-y-6">
                {/* Step 1: Issue Detection */}
                <CycleStep
                  icon={Brain}
                  title="Issue Detection"
                  engine="Harvex Engine"
                  description="User reports or auto-detects malfunction"
                  delay={0.6}
                />

                {/* Arrow 1 */}
                <CycleArrow delay={1.1} className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-white/70 rotate-90" />
                </CycleArrow>

                {/* Step 2: Test Generation and Execution */}
                <CycleStep
                  icon={Zap}
                  title="Test Generation and Execution"
                  engine="Test Engine"
                  description="AI-powered test creation & execution"
                  delay={0.7}
                />

                {/* Arrow 2 */}
                <CycleArrow delay={1.2} className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-white/70 rotate-90" />
                </CycleArrow>

                {/* Step 3: Bug Fix */}
                <CycleStep
                  icon={Shield}
                  title="Bug Fix"
                  engine="Defix Engine"
                  description="Auto debug & fix code"
                  delay={0.8}
                />

                {/* Arrow 3 */}
                <CycleArrow delay={1.3} className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-white/70 rotate-90" />
                </CycleArrow>

                {/* Step 4: Re-test */}
                <CycleStep
                  icon={Zap}
                  title="Re-test"
                  engine="Test Engine"
                  description="Validate fix works properly"
                  delay={0.9}
                />

                {/* Arrow 4 */}
                <CycleArrow delay={1.4} className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-white/70 rotate-90" />
                </CycleArrow>

                {/* Step 5: Deployment */}
                <CycleStep
                  icon={Play}
                  title="Deployment"
                  engine="Defix Engine"
                  description="Auto deploy to production"
                  delay={1.0}
                />

                {/* Arrow 5 */}
                <CycleArrow delay={1.5} className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-white/70 rotate-90" />
                </CycleArrow>

                {/* Step 6: Detailed Report */}
                <CycleStep
                  icon={FileText}
                  title="Detailed Report"
                  engine="All Engines"
                  description="Summary of changes and tests performed"
                  delay={1.1}
                />

              </div>

              {/* Cycle Label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="text-center mt-12"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white">Continuous Autonomous Cycle</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { number: "99.9%", label: "Accuracy" },
              { number: "10x", label: "Faster" },
              { number: "1000+", label: "Tests/Day" },
              { number: "24/7", label: "Monitoring" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>

      {/* Engine Detail Modal */}
      <EngineDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        engine={selectedEngine}
      />
    </section>
  )
}

export default Hero
