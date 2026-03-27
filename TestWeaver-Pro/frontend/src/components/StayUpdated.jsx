import { motion } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'

const StayUpdated = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-16 bg-black border-t border-white/10"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-primary mb-6"
          >
            <Mail className="w-5 h-5 text-white" />
            <span className="text-sm font-medium text-white">
              Stay Connected
            </span>
          </motion.div>

          <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Stay Updated
          </h3>
          <p className="text-gray-400 mb-8 text-lg">
            Get the latest updates on new features, improvements, and testing best practices.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 input-glass text-center sm:text-left"
            />
            <button className="btn-primary px-8 group">
              <span className="flex items-center gap-2">
                Subscribe
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

export default StayUpdated
