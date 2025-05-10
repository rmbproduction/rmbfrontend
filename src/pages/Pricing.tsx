import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Shield, PenTool as Tool, Wrench, Calendar, Users, Star } from 'lucide-react';
import { 
  SubscriptionPlan, // Keep for backward compatibility
  Plan,
  PlanVariant
} from '../models/subscription-plan';
import { apiService } from '../services/api.service';
import SubscriptionCalendarModal from '../components/SubscriptionCalendarModal';
import ThankYouModal from '../components/ThankYouModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Default features for each plan level - we may not need these anymore as features come from the API
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
  const location = useLocation();
  
  // State for plans and variants - new model
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planVariants, setPlanVariants] = useState<PlanVariant[]>([]);
  
  // Keep old state for backward compatibility
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modals
  const [selectedPlanVariant, setSelectedPlanVariant] = useState<PlanVariant | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [showThankYouModal, setShowThankYouModal] = useState<boolean>(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  // Keep old state for backward compatibility
  const [selectedPlanOption, setSelectedPlanOption] = useState<any | null>(null);

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from new API first
        try {
          console.log('Attempting to fetch plans from new API');
          const plansData = await apiService.getPlans();
          console.log('Plans data received:', plansData);
          setPlans(plansData);
          
          // Fetch all variants
          console.log('Attempting to fetch plan variants from new API');
          const variantsData = await apiService.getPlanVariants();
          console.log('Variants data received:', variantsData);
          setPlanVariants(variantsData);
          
          // If we have plans, we're using the new API
          if (plansData.length > 0) {
            console.log('Successfully using new API');
            setError(null);
            return;
          }
        } catch (err) {
          console.warn('New subscription API not available, falling back to old API', err);
        }
        
        // Fallback to old API
        try {
          console.log('Attempting to fetch plans from old API');
          const plans = await apiService.getSubscriptionPlans();
          console.log('Old API plans received:', plans);
          setSubscriptionPlans(plans);
          setError(null);
        } catch (err: any) {
          // Only redirect if attempting authenticated operations
          if (err.message === 'Authentication required') {
            console.warn('Legacy API requires authentication, skipping');
          } else {
            console.error('Error fetching legacy plans:', err);
            setError('Failed to load subscription plans. Please try again later.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, [navigate, location]);

  // Helper function to determine if we're using the new API
  const isUsingNewApi = () => {
    return plans.length > 0;
  };
  
  // Get variants for a specific plan
  const getVariantsForPlan = (planId: number) => {
    return planVariants.filter(variant => variant.plan === planId);
  };

  // Handle booking button click to navigate to checkout
  const handleBookClick = (planVariant: PlanVariant) => {
    // Store the selected variant in session storage for the checkout page
    try {
      const plan = plans.find(p => p.id === planVariant.plan);
      if (plan) {
        const checkoutData = {
          id: planVariant.id,
          plan: planVariant.plan,
          plan_name: plan.name,
          plan_type: plan.plan_type,
          plan_description: plan.description,
          features: plan.features,
          price: planVariant.price,
          discounted_price: planVariant.discounted_price,
          duration_type: planVariant.duration_type,
          duration_display: planVariant.duration_display || convertDurationTypeToDisplay(planVariant.duration_type),
          max_visits: planVariant.max_visits
        };
        sessionStorage.setItem('subscriptionPlan', JSON.stringify(checkoutData));
        navigate('/service-checkout', { state: { isSubscription: true } });
      }
    } catch (err) {
      console.error('Error storing plan data:', err);
      toast.error('Could not process your request. Please try again.');
    }
  };
  
  // Helper function to convert duration_type to display text if duration_display is missing
  const convertDurationTypeToDisplay = (durationType: string): string => {
    switch (durationType) {
      case 'quarterly':
        return 'Quarterly (3 months)';
      case 'half_yearly':
        return 'Half-Yearly (6 months)';
      case 'yearly':
        return 'Yearly (12 months)';
      default:
        return durationType.charAt(0).toUpperCase() + durationType.slice(1);
    }
  };
  
  // Handle legacy booking for old API
  const handleLegacyBookClick = (planOption: any) => {
    // Store the selected option in session storage for the checkout page
    try {
      const plan = subscriptionPlans.find(p => p.options.some(o => o.id === planOption.id));
      if (plan) {
        const checkoutData = {
          id: planOption.id,
          name: plan.name,
          description: plan.description,
          price: planOption.price,
          duration: planOption.duration,
          max_services: planOption.max_services,
          recommended: plan.recommended,
          features: getFeatures(plan)
        };
        sessionStorage.setItem('subscriptionPlan', JSON.stringify(checkoutData));
        navigate('/service-checkout', { state: { isSubscription: true } });
      }
    } catch (err) {
      console.error('Error storing plan data:', err);
      toast.error('Could not process your request. Please try again.');
    }
  };
  
  // Handle confirmation of dates from calendar modal for new API
  const handleDateConfirmation = async (planVariant: PlanVariant | any, dates: Date[]) => {
    setShowCalendarModal(false);
    setSelectedDates(dates);
    
    try {
      if (isUsingNewApi() && planVariant) {
        try {
          // Create subscription request with new API
          await apiService.createSubscriptionRequest(planVariant.id);
          setShowThankYouModal(true);
        } catch (error: any) {
          // Check if authentication is required
          if (error.message === 'Authentication required') {
            // Redirect to login page
            navigate('/login-signup', { state: { from: location.pathname } });
            toast.error('Please login to subscribe to a plan');
          } else {
            toast.error('Failed to create subscription request. Please try again.');
          }
        }
      } else if (planVariant) {
        try {
          // Log for old API - you can keep the legacy approach here
          console.log('Legacy subscription request', { 
            planOption: planVariant.id, 
            dates: dates.map(date => date.toISOString().split('T')[0]) 
          });
          setShowThankYouModal(true);
        } catch (error: any) {
          // Check if authentication is required
          if (error.message === 'Authentication required') {
            // Redirect to login page
            navigate('/login-signup', { state: { from: location.pathname } });
            toast.error('Please login to subscribe to a plan');
          } else {
            toast.error('Failed to create subscription request. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error creating subscription request:', error);
      toast.error('Failed to create subscription request. Please try again.');
    }
  };
  
  // Handle closing the thank you modal
  const handleThankYouClose = () => {
    setShowThankYouModal(false);
    setSelectedPlanVariant(null);
    setSelectedDates([]);
  };
  
  // Keep legacy methods for backward compatibility
  const getFeatures = (plan: SubscriptionPlan) => {
    const defaultFeatures = planFeatures[plan.name as keyof typeof planFeatures] || [];
    return defaultFeatures;
  };
  
  const getVisitCount = (plan: SubscriptionPlan): number => {
    if (!plan.description) return 1;
    
    const visitMatch = plan.description.match(/(\d+)\s*visits?/i);
    if (visitMatch && visitMatch[1]) {
      return parseInt(visitMatch[1], 10);
    }
    
    return 1;
  };
  
  const formatVisits = (plan: SubscriptionPlan): string => {
    const visits = getVisitCount(plan);
    return `${visits} ${visits === 1 ? 'Visit' : 'Visits'}`;
  };
  
  // Helper function to group variants by their plan
  const groupVariantsByPlan = (variants: PlanVariant[]) => {
    const groups: Record<number, PlanVariant[]> = {};
    
    variants.forEach(variant => {
      if (!groups[variant.plan]) {
        groups[variant.plan] = [];
      }
      groups[variant.plan].push(variant);
    });
    
    return groups;
  };

  // When using the new API, display plan variants
  const renderNewPlanVariants = () => {
    if (plans.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">No Subscription Plans Available</h3>
          <p className="text-gray-600 mb-6">We're currently updating our subscription plans. Please check back later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#FF5733] text-white py-2 px-4 rounded-lg hover:bg-[#ff4019]"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    const variantsByPlan = groupVariantsByPlan(planVariants);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-[#FF5733] to-[#ff4019] p-6 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                {plan.plan_type === 'premium' && (
                  <span className="bg-[#FFC107] text-[#333333] text-xs px-3 py-1 rounded-full font-bold">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="mt-2 opacity-90">{plan.description}</p>
            </div>
            
            {/* Features */}
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-800 mb-4">Features:</h3>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Variants */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                {variantsByPlan[plan.id]?.[0]?.duration_display || "Subscription Options"}:
              </h3>
              
              <div className="space-y-4">
                {(variantsByPlan[plan.id] || [])
                  .sort((a, b) => a.max_visits - b.max_visits)
                  .map(variant => (
                    <div key={variant.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition duration-150">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          {/* Duration Badge */}
                          <div className="mb-3">
                            <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-3 py-1 rounded-full font-semibold uppercase">
                              {variant.duration_display}
                            </span>
                          </div>
                          
                          {/* Price Display */}
                          <div className="mb-2">
                            {variant.discounted_price ? (
                              <>
                                <span className="text-2xl font-bold text-[#FF5733]">₹{variant.discounted_price}</span>
                                <span className="ml-2 text-gray-400 line-through text-base">₹{variant.price}</span>
                                <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                                  SAVE ₹{(Number(variant.price) - Number(variant.discounted_price)).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-[#FF5733]">₹{variant.price}</span>
                            )}
                          </div>
                          
                          {/* Visits Display */}
                          <div className="flex items-center text-gray-700">
                            <Users className="w-4 h-4 mr-1 text-[#FFC107]" />
                            <span><strong>{variant.max_visits}</strong> service visits</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleBookClick(variant)}
                          className="mt-4 md:mt-0 w-full md:w-auto bg-[#FF5733] hover:bg-[#ff4019] text-white py-2 px-6 rounded-md transition duration-150 flex items-center justify-center"
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render function for legacy plans
  const renderLegacyPlans = () => {
    if (subscriptionPlans.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">No Subscription Plans Available</h3>
          <p className="text-gray-600 mb-6">We're currently updating our subscription plans. Please check back later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#FF5733] text-white py-2 px-4 rounded-lg hover:bg-[#ff4019]"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {subscriptionPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 flex items-center">
              {plan.name}
              {plan.recommended && <Star className="ml-2 text-yellow-400 w-5 h-5" />}
            </h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <div className="mb-4">
              <span className="text-sm text-blue-700 font-semibold">Flat {plan.labour_discount_percent}% off on labour charge for additional work</span>
            </div>
            <div className="space-y-4 mb-6">
              {plan.options.map((option) => (
                <div key={option.id} className="border rounded-lg p-4 flex flex-col bg-blue-50">
                  <div className="mb-3">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-3 py-1 rounded-full font-semibold uppercase">
                      {option.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {option.original_price && (
                        <span className="text-gray-400 line-through text-base mr-2">₹{option.original_price}</span>
                      )}
                      <span className="text-2xl font-bold text-[#FF5733]">₹{option.price}</span>
                      {option.discount_percent && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">{option.discount_percent}% OFF</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-[#FFC107]" />
                      <span><strong>Max {option.max_services}</strong> service{option.max_services > 1 ? 's' : ''}</span>
                    </div>
                    <button className="ml-4 px-4 py-2 bg-[#FF5733] hover:bg-[#ff4019] text-white rounded transition" onClick={() => handleLegacyBookClick(option)}>
                      Book
                    </button>
                  </div>
                  <ul className="list-disc pl-5 text-gray-600 text-sm mt-2">
                    {option.services.map((service) => (
                      <li key={service.id} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{service.service_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
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
              <Calendar className="h-6 w-6 text-[#FF5733] mr-3 flex-shrink-0" />
              <p className="text-[#333333] font-medium">
                {isUsingNewApi() 
                  ? "All subscription plans require approval before scheduling. Our team will contact you after approval."
                  : "All subscription plans include flexible scheduling. Choose your preferred service dates after subscribing."
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        {loading ? (
          // Loading state - show skeleton loaders
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {Array(3).fill(0).map((_, index) => (
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
            ))}
          </div>
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
          // Loaded state - show appropriate plans based on API
          isUsingNewApi() ? renderNewPlanVariants() : renderLegacyPlans()
        )}

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
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start mb-3">
                <span className="bg-[#FFF5F2] text-[#FF5733] text-xs px-2 py-1 rounded font-semibold mr-2">Q</span>
                <h3 className="text-lg font-semibold text-gray-900">How do the subscriptions work?</h3>
              </div>
              <p className="text-gray-600 ml-7">
                {isUsingNewApi() 
                  ? "Choose a plan, submit a subscription request, and after approval, we'll contact you to schedule service visits."
                  : "Choose a plan that fits your needs, select your preferred service dates, and we'll come to your location to provide service on the selected dates."
                }
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start mb-3">
                <span className="bg-[#FFF5F2] text-[#FF5733] text-xs px-2 py-1 rounded font-semibold mr-2">Q</span>
                <h3 className="text-lg font-semibold text-gray-900">Can I reschedule my service date?</h3>
              </div>
              <p className="text-gray-600 ml-7">
                Yes, you can reschedule your service date up to 24 hours before the appointment by contacting our customer service.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start mb-3">
                <span className="bg-[#FFF5F2] text-[#FF5733] text-xs px-2 py-1 rounded font-semibold mr-2">Q</span>
                <h3 className="text-lg font-semibold text-gray-900">What if I need more services?</h3>
              </div>
              <p className="text-gray-600 ml-7">
                You can always add additional services to your subscription. Our technician will provide a quote for any extra work needed.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start mb-3">
                <span className="bg-[#FFF5F2] text-[#FF5733] text-xs px-2 py-1 rounded font-semibold mr-2">Q</span>
                <h3 className="text-lg font-semibold text-gray-900">Do you cover all types of bikes?</h3>
              </div>
              <p className="text-gray-600 ml-7">
                We service most types of bikes including mountain bikes, road bikes, hybrid bikes, and e-bikes. Contact us if you have a specialty bike.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Calendar Modal */}
      {showCalendarModal && (selectedPlanVariant || selectedPlanOption) && (
        <SubscriptionCalendarModal
          plan={selectedPlanVariant || selectedPlanOption}
          onClose={() => setShowCalendarModal(false)}
          onConfirm={handleDateConfirmation}
        />
      )}
      
      {/* Thank You Modal */}
      {showThankYouModal && (selectedPlanVariant || selectedPlanOption) && (
        <ThankYouModal
          type="subscription"
          onClose={handleThankYouClose}
          title={isUsingNewApi() ? "Subscription Request Submitted!" : "Subscription Confirmed!"}
          message={isUsingNewApi() 
            ? "Thank you for your subscription request. Our team will review it and get back to you shortly for approval."
            : "Thank you for subscribing to our service plan. We'll contact you shortly to confirm all details."
          }
          subscriptionData={{
            name: selectedPlanVariant 
              ? selectedPlanVariant.plan_name 
              : selectedPlanOption?.name || '',
            price: selectedPlanVariant 
              ? selectedPlanVariant.discounted_price 
              : selectedPlanOption?.price || '',
            duration: selectedPlanVariant 
              ? selectedPlanVariant.duration_display 
              : selectedPlanOption?.duration || '',
            visits: selectedPlanVariant 
              ? selectedPlanVariant.max_visits 
              : getVisitCount(selectedPlanOption) || 1
          }}
        />
      )}
    </div>
  );
};

export default Pricing;
