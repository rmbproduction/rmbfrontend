import { CalendarCheck, Wrench, Truck, CreditCard, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: CalendarCheck,
    title: "Book Your Service",
    description: "Choose your service type and schedule a convenient time slot for pickup or home service."
  },
  {
    icon: Truck,
    title: "Free Pickup",
    description: "Our team will pick up your bike from your location at no additional cost."
  },
  {
    icon: Wrench,
    title: "Expert Repair",
    description: "Our experienced mechanics will diagnose and repair your bike with genuine parts."
  },
  {
    icon: CreditCard,
    title: "Easy Payment",
    description: "Pay conveniently through UPI or cash after service completion."
  },
  {
    icon: CheckCircle2,
    title: "Free Delivery",
    description: "We'll deliver your bike back to your doorstep, fully serviced and ready to ride."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">How Our Service Works</h2>
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
                      <div className="h-16 w-16 rounded-full bg-[#FFF5F2] flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-[#FF5733]" />
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