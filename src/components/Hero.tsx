import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pt-20 pb-32 lg:pt-32 lg:pb-48">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="px-4 sm:px-6 lg:px-8"
          >
            <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                  <span className="block text-gray-900 mb-4">Bike Repair at</span>
                  <span className="block text-[#FF5733] relative">
                    Your Doorstep!
                    <motion.span
                      className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF5733]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1, duration: 0.8 }}
                    />
                  </span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="mt-6 text-xl text-gray-600 max-w-lg"
                >
                  Professional bike repair and maintenance services at your convenience. Our expert mechanics come to you!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="mt-10 flex flex-col sm:flex-row gap-4 lg:justify-start justify-center"
                >
                  <button className="transform hover:scale-105 transition-transform px-8 py-4 bg-[#FF5733] text-white rounded-xl shadow-lg hover:shadow-xl font-semibold text-lg">
                    Book  Now
                  </button>
                  <button className="transform hover:scale-105 transition-transform flex items-center justify-center px-8 py-4 border-2 border-[#FF5733] text-[#FF5733] rounded-xl font-semibold text-lg">
                    <MapPin className="w-5 h-5 mr-2" />
                    Track Your Mechanic
                  </button>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mt-12 lg:mt-0 relative"
              >
                <div className="floating relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl transform perspective-1000">
                  <img
                    className="w-full h-full object-cover"
                    src="src/components/bikeExpert.jpeg"
                    alt="Bike mechanic working"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Available Now</p>
                      <p className="text-xs text-gray-500">5 mechanics nearby</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Hero;