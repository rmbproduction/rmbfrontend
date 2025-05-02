import { MapPin, Calendar, Activity, Award } from 'lucide-react';

const steps = [
  {
    icon: MapPin,
    title: 'Select Your Location',
    description: 'Choose your preferred service location',
  },
  {
    icon: Calendar,
    title: 'Book a Mechanic',
    description: 'Schedule a convenient time for service',
  },
  {
    icon: Activity,
    title: 'Live Tracking',
    description: 'Track your mechanic in real-time',
  },
  {
    icon: Award,
    title: 'Service Warranty',
    description: 'Get warranty on all repairs',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-xl text-gray-500">Simple steps to get your bike serviced</p>
        </div>

        <div className="mt-16">
          <div className="relative">
            {/* Hide line on mobile */}
            <div className="absolute inset-0 flex items-center hidden md:flex" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            {/* Make steps stack on mobile */}
            <div className="relative flex flex-col md:flex-row md:justify-between space-y-8 md:space-y-0">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="text-center flex-1">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-[#FF5733] flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;