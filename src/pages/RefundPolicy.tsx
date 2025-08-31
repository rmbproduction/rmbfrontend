import React from 'react';
import { motion } from 'framer-motion';

const RefundPolicy = () => {
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
              RepairMyBike - Refund Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 mb-4">
                At RepairMyBike, we strive to provide excellent service. This refund policy outlines when and how 
                refunds are processed for our doorstep two-wheeler repair and spare parts services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility for Refunds</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">You Are Eligible for a Full Refund If:</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Service Not Provided</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>We fail to show up for your scheduled appointment</li>
                  <li>Technical issues prevent us from completing the booked service</li>
                  <li>Service is cancelled by RepairMyBike due to our limitations</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Incorrect Service/Product Delivered</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>You receive a different service than what you booked</li>
                  <li>Wrong spare parts or accessories are delivered</li>
                  <li>Service performed does not match your booking specifications</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Payment Errors</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Duplicate charges due to technical glitches</li>
                  <li>Overcharging due to system errors</li>
                  <li>Payment processed but service not recorded in our system</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. When Refunds Are NOT Available</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Non-Refundable Situations:</h3>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Completed Services</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Service successfully completed as per your booking</li>
                  <li>Work performed meets industry standards and your specifications</li>
                  <li>You approved the service during or after completion</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Customer-Related Issues</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Problems arising from your negligence after service completion</li>
                  <li>Failure to follow maintenance recommendations provided</li>
                  <li>Damage caused by misuse after our service</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">External Factors</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Delays caused by traffic conditions</li>
                  <li>Weather-related postponements</li>
                  <li>Issues with third-party suppliers or manufacturers</li>
                  <li>Force majeure events beyond our control</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Post-Arrival Cancellations</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>You cancel the service after our technician arrives at your location</li>
                  <li>You're unavailable after confirming the appointment</li>
                  <li>You refuse service due to personal reasons unrelated to our service quality</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Refund Process</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">How to Request a Refund</h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Step 1: Contact Us</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Submit your refund request through our website, app, or customer support</li>
                  <li>Provide your booking reference number</li>
                  <li>Clearly explain the reason for your refund request</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Step 2: Documentation</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Provide relevant photos or documentation if applicable</li>
                  <li>Share details about the service issue or problem experienced</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Step 3: Review Process</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Our team will review your request within 24-48 hours</li>
                  <li>We may contact you for additional information or clarification</li>
                  <li>Investigation may include technician feedback and service records</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Refund Timeline</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Request Submission:</strong> Within 7 calendar days of the transaction date</li>
                <li><strong>Processing Time:</strong> 7-10 working days after approval</li>
                <li><strong>Refund Method:</strong> Original payment method used for the transaction</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partial Refunds and Alternatives</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">When We May Offer Alternatives:</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Service Credits</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>For minor service dissatisfaction</li>
                  <li>When you prefer to try our services again</li>
                  <li>Credits valid for 6 months from issue date</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Discounts on Future Services</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>For inconvenience caused by delays or rescheduling</li>
                  <li>Percentage discount based on the nature of the issue</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Partial Refunds</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>When part of the service was completed satisfactorily</li>
                  <li>For spare parts that cannot be returned but service was unsatisfactory</li>
                  <li>Based on the actual value of satisfactory work completed</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Special Circumstances</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Emergency Services</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Different refund terms may apply for emergency or urgent repair services</li>
                <li>Premium charges for emergency services are non-refundable unless service is not provided</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Promotional Services</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Services booked under special promotions or discounts may have modified refund terms</li>
                <li>Refund amount may be limited to actual amount paid after discount</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Group or Corporate Bookings</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Special refund terms may apply for bulk or corporate service agreements</li>
                <li>Refund policies will be specified in the corporate service contract</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Refund Exceptions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Non-Refundable Fees:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Convenience fees or processing charges (where applicable)</li>
                <li>Cancellation charges for late cancellations</li>
                <li>Emergency service premiums (unless service not provided)</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">If you disagree with our refund decision:</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li><strong>Step 1:</strong> Request escalation to our management team</li>
                  <li><strong>Step 2:</strong> Provide additional evidence or documentation</li>
                  <li><strong>Step 3:</strong> Allow 3-5 business days for management review</li>
                  <li><strong>Step 4:</strong> Final decision will be communicated in writing</li>
                </ol>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact for Refund Requests</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Customer Support</h3>
                <ul className="space-y-2 text-blue-700">
                  <li><strong>Website:</strong> https://repairmybike.in</li>
                  <li><strong>Email:</strong> support@repairmybike.in</li>
                  <li><strong>Phone:</strong> 8168-1217-11</li>
                  <li><strong>App:</strong> Through the RepairMyBike mobile app</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Required Information for Refund Requests:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Full name and contact information</li>
                <li>Booking reference number</li>
                <li>Date of service or transaction</li>
                <li>Detailed explanation of the issue</li>
                <li>Supporting documentation (if applicable)</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Legal Rights</h2>
              <p className="text-gray-700 mb-4">
                This refund policy does not affect your statutory rights as a consumer under applicable law. 
                In case of conflict between this policy and local consumer protection laws, the law will prevail.
              </p>
            </section>

            {/* Footer */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-center text-gray-700 font-medium">
                RepairMyBike reserves the right to update this refund policy. Customers will be notified of any 
                changes via email or app notifications.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;
