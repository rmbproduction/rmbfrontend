import { motion } from 'framer-motion';
import { Wrench, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';

const AboutUsSection = () => {
  return (
    <section className="py-16 bg-white" id="about-us">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-bold mb-4"
            >
              Our Story
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="w-24 h-1 bg-[#FF5733] mx-auto mb-8"
            ></motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="lg:col-span-3 text-gray-700"
            >
              <p className="mb-4 text-lg">
                Founded in May 2025, RepairMyBike is more than just a bike repair service — it's the modern revival of a legacy built on trust, skill, and passion for two-wheelers.
              </p>
              <p className="mb-6">
                Our mission is simple: to bring professional, reliable, and convenient bike repair services right to your doorstep. With certified mechanics, modern service units, and a commitment to excellence, we're here to make sure your bike gets expert care—anytime, anywhere.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-[#FF5733] bg-opacity-10 rounded-lg mr-3">
                    <Calendar className="w-5 h-5 text-[#FF5733]" />
                  </div>
                  <span>Founded in 2025</span>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-[#FF5733] bg-opacity-10 rounded-lg mr-3">
                    <Wrench className="w-5 h-5 text-[#FF5733]" />
                  </div>
                  <span>Expert Mechanics</span>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-[#FF5733] bg-opacity-10 rounded-lg mr-3">
                    <Users className="w-5 h-5 text-[#FF5733]" />
                  </div>
                  <span>Family Business</span>
                </div>
              </div>

              <Link 
                to="/about" 
                className="inline-block mt-4 bg-[#FF5733] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#ff4019] transition-colors"
              >
                Read Our Full Story
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="relative h-full">
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[#FF5733] opacity-10 rounded-xl transform rotate-3"></div>
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-gray-200 rounded-xl transform -rotate-3"></div>
                <div className="relative rounded-xl overflow-hidden h-full shadow-lg">
                  <OptimizedImage 
                    src="/assets/founder.jpg" 
                    alt="RepairMyBike Founder" 
                    width={600}
                    height={800}
                    quality={90}
                    className="w-full h-full"
                    objectFit="cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold text-xl">Mohit Singh</h3>
                    <p>Founder</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUsSection; 