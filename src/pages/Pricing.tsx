import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Shield, PenTool as Tool, Wrench, Calendar, Users, Star } from 'lucide-react';
import { SubscriptionPlan } from '../models/subscription-plan';
import { apiService } from '../services/api.service';
import SubscriptionCalendarModal from '../components/SubscriptionCalendarModal';
import ThankYouModal from '../components/ThankYouModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Default features for each plan level
const planFeatures = {
  'Basic Service': [
    'Basic Safety Inspection',
    'Tire Pressure Check',
    'Chain Lubrication',
    'Brake Adjustment',
    'Gear Tuning'
  ],
  'Premium Service': [
    'Full Safety Inspection',
    'Wheel Truing',
    'Drivetrain Cleaning',
    'Brake Bleeding',
    'Cable Replacement',
    'Frame Cleaning',
    'Suspension Check'
  ],
  'Pro Service': [
    'Complete Bike Overhaul',
    'Fork Service',
    'Bearing Replacement',
    'Frame Alignment',
    'Custom Tuning',
    'Performance Testing',
    'Parts Upgrade Consultation',
    '3-Month Warranty'
  ]
};

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
    price: '+₹30',
    description: '24/7 emergency repair service'
  },
  {
    icon: Shield,
    name: 'Extended Warranty',
    price: '+₹19',
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
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modals
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [showThankYouModal, setShowThankYouModal] = useState<boolean>(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setLoading(true);
        const plans = await apiService.getSubscriptionPlans();
        setSubscriptionPlans(plans);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  // Get features based on plan name or use default features
  const getFeatures = (plan: SubscriptionPlan) => {
    const defaultFeatures = planFeatures[plan.name as keyof typeof planFeatures] || [];
    return defaultFeatures;
  };
  
  // Get number of visits from plan description
  const getVisitCount = (plan: SubscriptionPlan): number => {
    if (!plan.description) return 1;
    
    const visitMatch = plan.description.match(/(\d+)\s*visits?/i);
    if (visitMatch && visitMatch[1]) {
      return parseInt(visitMatch[1], 10);
    }
    
    return 1;
  };
  
  // Handle booking button click to open calendar modal
  const handleBookClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowCalendarModal(true);
  };
  
  // Handle confirmation of dates from calendar modal
  const handleDateConfirmation = async (plan: SubscriptionPlan, dates: Date[]) => {
    // Close calendar modal
    setShowCalendarModal(false);
    setSelectedDates(dates);
    
    try {
      // Here you would typically save the subscription to your backend
      // For now, we'll simulate a successful response
      
      // Optional: Call an API to save the subscription
      // const response = await apiService.createSubscription({
      //   plan_id: plan.id,
      //   dates: dates.map(date => date.toISOString().split('T')[0]),
      // });
      
      // Show thank you modal
      setShowThankYouModal(true);
      
      // Log the subscription data
      console.log('Subscription confirmed', {
        plan,
        dates: dates.map(date => date.toISOString().split('T')[0])
      });
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription. Please try again.');
    }
  };
  
  // Handle closing the thank you modal
  const handleThankYouClose = () => {
    setShowThankYouModal(false);
    setSelectedPlan(null);
    setSelectedDates([]);
  };
  
  const formatVisits = (plan: SubscriptionPlan): string => {
    const visits = getVisitCount(plan);
    return `${visits} ${visits === 1 ? 'Visit' : 'Visits'}`;
  };
  
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
          <div className="mt-6 inline-block bg-gradient-to-r from-orange-100 to-amber-100 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0" />
              <p className="text-amber-800 font-medium">
                All subscription plans include flexible scheduling. Choose your preferred service dates after subscribing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {loading ? (
            // Loading state - show skeleton loaders
            Array(3).fill(0).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden p-8"
              >
                <div className="h-8 bg-gray-200 rounded-md animate-pulse mb-4"></div>
                <div className="h-10 bg-gray-200 rounded-md animate-pulse mb-4 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded-md animate-pulse mb-6"></div>
                <div className="h-4 bg-gray-200 rounded-md animate-pulse mb-6"></div>
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded-md animate-pulse"></div>
                  ))}
                </div>
                <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-8"></div>
              </motion.div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-3 text-center py-10">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-[#FF5733] text-white py-2 px-4 rounded-lg hover:bg-[#ff4019]"
              >
                Try Again
              </button>
            </div>
          ) : (
            // Loaded state - show subscription plans
            subscriptionPlans.map((plan, index) => (
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
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="ml-2 text-gray-500">/{plan.duration.toLowerCase()}</span>
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex items-center text-gray-600 bg-gray-100 py-1 px-3 rounded-full text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{plan.duration}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 bg-gray-100 py-1 px-3 rounded-full text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatVisits(plan)}</span>
                    </div>
                    
                    {plan.recommended && (
                      <div className="flex items-center text-amber-700 bg-amber-100 py-1 px-3 rounded-full text-sm">
                        <Star className="w-4 h-4 mr-1" />
                        <span>Best Value</span>
                      </div>
                    )}
                  </div>
                  
                  <ul className="mt-6 space-y-4">
                    {getFeatures(plan).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={() => handleBookClick(plan)}
                    className="mt-8 w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Subscribe & Schedule</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Additional Services Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-4">Additional Services</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Enhance your subscription with these add-ons or book them separately as needed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
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
        
        {/* Frequently Asked Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do the subscriptions work?</h3>
              <p className="text-gray-600">
                Choose a plan that fits your needs, select your preferred service dates, and we'll come to your location to provide service on the selected dates.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I reschedule my service date?</h3>
              <p className="text-gray-600">
                Yes, you can reschedule your service date up to 24 hours before the appointment by contacting our customer service.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if I need more services?</h3>
              <p className="text-gray-600">
                You can always add additional services to your subscription. Our technician will provide a quote for any extra work needed.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Do you cover all types of bikes?</h3>
              <p className="text-gray-600">
                We service most types of bikes including mountain bikes, road bikes, hybrid bikes, and e-bikes. Contact us if you have a specialty bike.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Calendar Modal */}
      {showCalendarModal && selectedPlan && (
        <SubscriptionCalendarModal
          plan={selectedPlan}
          onClose={() => setShowCalendarModal(false)}
          onConfirm={handleDateConfirmation}
        />
      )}
      
      {/* Thank You Modal */}
      {showThankYouModal && selectedPlan && (
        <ThankYouModal
          type="subscription"
          onClose={handleThankYouClose}
          title="Subscription Confirmed!"
          message="Thank you for subscribing to our service plan. We'll contact you shortly to confirm all details."
          subscriptionData={{
            name: selectedPlan.name,
            price: selectedPlan.price,
            duration: selectedPlan.duration,
            visits: getVisitCount(selectedPlan)
          }}
        />
      )}
    </div>
  );
};

export default Pricing;
