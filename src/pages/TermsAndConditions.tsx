import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              RepairMyBike - Terms and Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. About Our Services</h2>
              <p className="text-gray-700 mb-4">
                RepairMyBike provides professional doorstep two-wheeler repair, servicing, and spare parts delivery. 
                By using our services, you agree to these terms and conditions.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Scope</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What We Offer</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Doorstep motorcycle and scooter repair services</li>
                <li>Professional vehicle servicing and maintenance</li>
                <li>Genuine spare parts delivery</li>
                <li>Technical support and consultation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Areas</h3>
              <p className="text-gray-700 mb-3">Our services are available subject to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Technician availability in your area</li>
                <li>Accessibility of your location</li>
                <li>Safe working conditions at the service location</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Booking and Scheduling</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">How to Book</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Official RepairMyBike website</li>
                <li>Mobile application</li>
                <li>Customer support hotline</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Booking Requirements</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Accurate vehicle details (brand, model, year)</li>
                <li>Correct contact information</li>
                <li>Accessible service location</li>
                <li>Clear description of service needed</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Confirmation</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>All bookings require confirmation</li>
                <li>Service date and time will be mutually agreed upon</li>
                <li>Changes to booking must be made at least 2 hours before scheduled time</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Payment Methods</h3>
              <p className="text-gray-700 mb-4">
                We accept all major payment methods through secure payment gateways.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Payment Timing</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Full payment required before service completion</li>
                <li>Advance payment may be required for certain services</li>
                <li>No cash transactions with technicians</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Pricing</h3>
              <p className="text-gray-700 mb-3">Service charges as displayed on our platform. Additional charges may apply for:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Emergency or same-day services</li>
                <li>Services outside standard working hours</li>
                <li>Remote or difficult-to-access locations</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Customer Responsibilities</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Before Service</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide accurate vehicle and contact information</li>
                <li>Ensure vehicle is in accessible location</li>
                <li>Be available at scheduled time</li>
                <li>Inform us of any specific vehicle issues or requirements</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">During Service</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide safe working space for technician</li>
                <li>Allow technician to inspect vehicle thoroughly</li>
                <li>Approve any additional services before commencement</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">After Service</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Inspect completed work immediately</li>
                <li>Test vehicle operation before technician departure</li>
                <li>Report any concerns immediately</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Limitations</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">We Are Not Responsible For</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Pre-existing vehicle damage or defects</li>
                <li>Hidden problems not disclosed during booking</li>
                <li>Delays due to traffic, weather, or force majeure events</li>
                <li>Issues arising from incomplete or inaccurate information provided by customer</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Exclusions</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Vehicles in unsafe or dangerous condition</li>
                <li>Illegal modifications or non-standard parts</li>
                <li>Services requiring specialized equipment not available at doorstep</li>
                <li>Emergency roadside assistance</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Warranties and Guarantees</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Warranty</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Workmanship warranty as specified for each service type</li>
                <li>Warranty period begins from service completion date</li>
                <li>Warranty void if vehicle is modified or serviced elsewhere during warranty period</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Parts Warranty</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Manufacturer warranty applies to all genuine parts</li>
                <li>RepairMyBike facilitates warranty claims but is not the warranty provider</li>
                <li>Warranty terms vary by manufacturer and part type</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Warranty Exclusions</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Consumable items (oils, filters, brake pads, etc.)</li>
                <li>Damage from accidents, misuse, or negligence</li>
                <li>Normal wear and tear</li>
                <li>Modifications or repairs by unauthorized persons</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Maximum Liability</h3>
              <p className="text-gray-700 mb-4">
                Our total liability for any service is limited to the amount paid for that specific service.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Excluded Damages</h3>
              <p className="text-gray-700 mb-3">We are not liable for:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of use of vehicle during service period</li>
                <li>Personal injury not directly caused by our negligence</li>
                <li>Damage to property other than the serviced vehicle</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cancellation Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Customer Cancellation</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Free cancellation up to 2 hours before scheduled service</li>
                <li>Cancellation after technician dispatch may incur charges</li>
                <li>No-show or cancellation after technician arrival will be charged full service fee</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">RepairMyBike Cancellation</h3>
              <p className="text-gray-700 mb-3">We may cancel service due to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Unsafe working conditions</li>
                <li>Inaccurate information provided by customer</li>
                <li>Vehicle condition requiring specialized equipment</li>
                <li>Force majeure events</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                All content, trademarks, and intellectual property on our platform remain the property of RepairMyBike. 
                Customers may not reproduce, distribute, or use our content without written permission.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Process</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Contact our customer support team first</li>
                <li>Allow 48-72 hours for initial response</li>
                <li>Escalation to management if needed</li>
                <li>Mediation before legal proceedings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These terms are governed by the laws of India. Any legal disputes will be subject to the jurisdiction 
                of courts in Rewari, Haryana.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                RepairMyBike reserves the right to modify these terms at any time. Customers will be notified of 
                significant changes via email or app notification. Continued use of services after changes constitutes 
                acceptance of new terms.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">For questions about these terms:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Website: https://repairmybike.in</li>
                <li>Email: support@repairmybike.in</li>
                <li>Phone:8168-1217-11</li>
                <li>Address: Automarket REWARI , Pin 123401 Street no. 1 HARYANA</li>
              </ul>
            </section>

            {/* Footer */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-center text-gray-700 font-medium">
                By using RepairMyBike services, you acknowledge that you have read, understood, and agree to be bound 
                by these Terms and Conditions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
