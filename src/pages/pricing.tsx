import React from 'react';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Choose the plan that best suits your needs. All plans include our core features.
          </p>
        </div>
        
        <SubscriptionPlans />

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Frequently asked questions
          </h2>
          <dl className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-10">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold text-gray-900">{faq.question}</dt>
                <dd className="mt-3 text-gray-500">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

const faqs = [
  {
    question: "What's included in the Basic Plan?",
    answer: "The Basic Plan includes essential bike maintenance services like brake adjustment, chain lubrication, screw tightening, air filter cleaning, and engine oil service. It's perfect for regular bike maintenance needs."
  },
  {
    question: "How many service visits do I get with each plan?",
    answer: "The number of service visits varies by plan duration. Quarterly plans include 2 visits, half-yearly plans include 3-4 visits, and yearly plans include up to 6 visits. Premium plans generally include more visits than Basic plans."
  },
  {
    question: "Can I upgrade from Basic to Premium plan?",
    answer: "Yes, you can upgrade from Basic to Premium plan at any time. When you upgrade, you'll get access to additional premium services like priority service, washing, polishing, and general bike inspection."
  },
  {
    question: "How do I schedule a service visit?",
    answer: "Once you subscribe to a plan, you can easily schedule service visits through our app or website. Select your preferred date and time, and our skilled mechanics will service your bike at your location."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods including credit/debit cards, UPI, and net banking. All payments are processed securely through our payment gateway."
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes, we offer a pro-rated refund for unused service visits if you need to cancel your subscription. Please contact our support team for refund requests."
  }
];

export default Pricing;