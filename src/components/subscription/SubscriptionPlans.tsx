import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance, API_ENDPOINTS } from '../../config/api.config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SubscriptionForm from './SubscriptionForm';
import ErrorModal from '../ErrorModal';

interface Plan {
  id: number;
  name: string;
  description: string;
  features: string[];
  is_popular: boolean;
}

interface PlanVariant {
  id: number;
  plan: number;
  duration_type: string;
  price: string;
  discounted_price: string | null;
}

const SubscriptionPlans: React.FC = () => {
  const [selectedDuration, setSelectedDuration] = useState<string>('quarterly');
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.plans);
      return response.data;
    }
  });

  // Fetch plan variants
  const { data: variants, isLoading: variantsLoading } = useQuery<PlanVariant[]>({
    queryKey: ['planVariants'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.planVariants);
      return response.data;
    }
  });

  const handleSubscribe = (variantId: number) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    setSelectedVariantId(variantId);
    setShowSubscriptionForm(true);
  };

  const handleSubscriptionError = (message: string) => {
    setShowSubscriptionForm(false);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  if (plansLoading || variantsLoading) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter variants by selected duration
  const filteredVariants = variants?.filter(v => v.duration_type === selectedDuration) || [];

  return (
    <>
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Duration Selector */}
          <div className="flex justify-center mb-8 space-x-3">
            <button
              onClick={() => setSelectedDuration('quarterly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedDuration === 'quarterly'
                  ? 'bg-[#FF5733] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedDuration('half_yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedDuration === 'half_yearly'
                  ? 'bg-[#FF5733] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Half Yearly
            </button>
            <button
              onClick={() => setSelectedDuration('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedDuration === 'yearly'
                  ? 'bg-[#FF5733] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Yearly
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans?.map((plan) => {
              const variant = filteredVariants.find(v => v.plan === plan.id);
              if (!variant) return null;

              const isPremium = plan.is_popular;
              const bgColor = isPremium ? 'bg-[#F5F2FF]' : 'bg-[#FFF5F2]';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg overflow-hidden ${bgColor} transition-all duration-300 hover:scale-102 hover:shadow-md ${
                    isPremium ? 'ring-1 ring-[#FF5733]' : ''
                  }`}
                >
                  {isPremium && (
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center bg-[#FF5733] text-white px-2 py-1 rounded-md text-xs font-medium">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">
                        ₹{variant.discounted_price}
                      </span>
                      {variant.price !== variant.discounted_price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ₹{variant.price}
                        </span>
                      )}
                      <span className="text-sm text-gray-600 ml-2">
                        / {selectedDuration}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
                    <button 
                      onClick={() => handleSubscribe(variant.id)}
                      className={`w-full mt-4 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        isPremium 
                          ? 'bg-[#FF5733] hover:bg-[#FF4520] text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      Subscribe Now
                    </button>
                  </div>

                  {/* Features List */}
                  <div className="p-6 bg-white rounded-t-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Includes:
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start group">
                          <Check className={`h-4 w-4 flex-shrink-0 mr-2 mt-0.5 transition-colors ${
                            isPremium ? 'text-[#FF5733]' : 'text-gray-400 group-hover:text-[#FF5733]'
                          }`} />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subscription Form Modal */}
      {showSubscriptionForm && selectedVariantId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-2xl mx-4">
            <SubscriptionForm
              planVariantId={selectedVariantId}
              onClose={() => setShowSubscriptionForm(false)}
              onError={handleSubscriptionError}
            />
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
        supportPhone="+91 1800 123 4567"
      />
    </>
  );
};

export default SubscriptionPlans; 