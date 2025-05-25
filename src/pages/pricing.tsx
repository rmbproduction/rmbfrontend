import { motion } from 'framer-motion';
import { Check, Clock, Shield, PenTool as Tool, Wrench } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Basic Service',
    price: '49',
    duration: '2-3 Hours',
    description: 'Essential maintenance for regular riders',
    features: [
      'Basic Safety Inspection',
      'Tire Pressure Check',
      'Chain Lubrication',
      'Brake Adjustment',
      'Gear Tuning'
    ],
    recommended: false
  },
  {
    name: 'Premium Service',
    price: '99',
    duration: '3-4 Hours',
    description: 'Comprehensive care for enthusiast riders',
    features: [
      'Full Safety Inspection',
      'Wheel Truing',
      'Drivetrain Cleaning',
      'Brake Bleeding',
      'Cable Replacement',
      'Frame Cleaning',
      'Suspension Check'
    ],
    recommended: true
  },
  {
    name: 'Pro Service',
    price: '149',
    duration: '4-5 Hours',
    description: 'Ultimate care for professional bikes',
    features: [
      'Complete Bike Overhaul',
      'Fork Service',
      'Bearing Replacement',
      'Frame Alignment',
      'Custom Tuning',
      'Performance Testing',
      'Parts Upgrade Consultation',
      '3-Month Warranty'
    ],
    recommended: false
  }
];

const additionalServices = [
  {
    icon: Tool,
    name: 'Parts Replacement',
    price: 'Varies',
    description: 'Quality replacement parts with warranty'
  },
  {
    icon: Clock,
    name: 'Emergency Service',
    price: '+$30',
    description: '24/7 emergency repair service'
  },
  {
    icon: Shield,
    name: 'Extended Warranty',
    price: '+$19',
    description: 'Additional 3 months of coverage'
  },
  {
    icon: Wrench,
    name: 'Custom Upgrades',
    price: 'Varies',
    description: 'Performance-focused modifications'
  }
];

const Pricing = () => {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-xl text-gray-600">Choose the perfect service package for your bike</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.recommended ? 'ring-2 ring-[#FF5733]' : ''
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-[#FF5733] text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                  Recommended
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="ml-2 text-gray-500">/service</span>
                </div>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                <div className="flex items-center mt-4 text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{plan.duration}</span>
                </div>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-8 w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors">
                  Book Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Additional Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <div className="w-12 h-12 bg-[#FFF5F2] rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-[#FF5733]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-[#FF5733] font-semibold mt-2">{service.price}</p>
                  <p className="text-gray-600 mt-2">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;