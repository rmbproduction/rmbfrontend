// CheckoutPage.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const CheckoutPage = () => {
  const [contactInfo, setContactInfo] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your API call or further booking logic here
    console.log("Booking Info:", contactInfo);
    alert("Booking received! We will contact you on WhatsApp to confirm.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ffe4d4] py-10">
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">Checkout</h1>
          <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
          <p className="mt-4 text-gray-600">
            Fill in your details, and we'll contact you on WhatsApp to confirm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact/Booking Info */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Your Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={contactInfo.name}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactInfo.phone}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    placeholder="e.g. +1 234 567 890\"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={contactInfo.address}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={contactInfo.city}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={contactInfo.state}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={contactInfo.zip}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (Sample) */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Booking Summary
              </h2>
              {/* Example items - replace with your actual data */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Bike Repair Package</span>
                  <span className="font-semibold">$100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Additional Parts</span>
                  <span className="font-semibold">$30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Service Fee</span>
                  <span className="font-semibold">$10</span>
                </div>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold">$140</span>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full py-3 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
            >
              Book Now
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;
