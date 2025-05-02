// FaqPage.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "How do I book a service?",
    answer:
      "You can book a service by clicking on the 'Book Now' button and filling in your details. We will contact you via WhatsApp to confirm your booking.",
  },
  {
    question: "What is included in the repair package?",
    answer:
      "Our repair package includes a comprehensive check of your bike, necessary repairs, and replacement of faulty parts based on our diagnosis.",
  },
  {
    question: "How long does the repair take?",
    answer:
      "Most repairs are completed within a few hours, depending on the complexity of the issue.",
  },
  {
    question: "Do you provide any warranty?",
    answer:
      "Yes, we offer a limited warranty on our repairs. Please contact our support team for more details.",
  },
];

const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4]">
      <div className="w-full max-w-4xl px-6">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left focus:outline-none flex justify-between items-center"
              >
                <span className="text-lg font-semibold text-gray-800">
                  {faq.question}
                </span>
                <span className="text-2xl text-[#FF5733]">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="px-6 pb-4 overflow-hidden text-gray-700"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
