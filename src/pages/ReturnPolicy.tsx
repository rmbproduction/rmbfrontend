import React from 'react';
import { motion } from 'framer-motion';

const ReturnPolicy = () => {
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
              RepairMyBike - Return Policy
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
                This return policy covers spare parts, accessories, and products purchased through RepairMyBike. 
                Please read this policy carefully before making any purchase.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligible Items for Return</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What Can Be Returned</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Spare Parts and Components:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Engine parts (pistons, rings, gaskets, etc.)</li>
                  <li>Electrical components (in original sealed packaging)</li>
                  <li>Body parts and accessories</li>
                  <li>Maintenance items (unused only)</li>
                  <li>Tools and equipment</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Condition Requirements:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Item must be unused and undamaged</li>
                  <li>Original packaging with all labels intact</li>
                  <li>All accessories and documentation included</li>
                  <li>No signs of installation or testing</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Return Time Frame</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Return request must be initiated within <strong>7 days</strong> of delivery</li>
                <li>Items must be returned within <strong>14 days</strong> of return authorization</li>
                <li>Late returns may be subject to restocking fees or rejection</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Non-Returnable Items</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Items That Cannot Be Returned</h3>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Installed or Used Parts:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Any part that has been installed on a vehicle</li>
                  <li>Items that show signs of use or testing</li>
                  <li>Parts with removed or damaged packaging</li>
                  <li>Components that have been modified or altered</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Safety and Hygiene Items:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Brake fluids and lubricants</li>
                  <li>Filters (oil, air, fuel) once opened</li>
                  <li>Electrical items removed from sealed packaging</li>
                  <li>Helmet liners and personal protective equipment</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Custom and Special Orders:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Made-to-order parts</li>
                  <li>Customized or modified components</li>
                  <li>Special import items</li>
                  <li>Parts ordered specifically for your vehicle model</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Consumable Items:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Engine oils and lubricants</li>
                  <li>Brake fluid and coolants</li>
                  <li>Cleaning products and chemicals</li>
                  <li>Items with limited shelf life</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Damaged by Customer:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Items damaged due to mishandling</li>
                  <li>Parts damaged during customer inspection</li>
                  <li>Items exposed to moisture, heat, or chemicals</li>
                  <li>Products with missing serial numbers or identification</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Return Process</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Step 1: Initiate Return Request</h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Contact Customer Support:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Call our return helpline: [phone number]</li>
                  <li>Email: [returns email address]</li>
                  <li>Through your account on our website/app</li>
                  <li>Live chat support during business hours</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Required Information:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Order number and purchase date</li>
                  <li>Product details and quantity</li>
                  <li>Reason for return</li>
                  <li>Photos of the item and packaging (if damaged)</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Step 2: Return Authorization</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Review Process:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Our team reviews your return request within 24-48 hours</li>
                  <li>Return authorization (RA) number issued if approved</li>
                  <li>Return shipping instructions provided</li>
                  <li>Return deadline specified</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Authorization Requirements:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Valid reason for return</li>
                  <li>Item meets return eligibility criteria</li>
                  <li>Proof of purchase verification</li>
                  <li>Customer account in good standing</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Step 3: Shipping the Item</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Packaging Requirements:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Use original packaging whenever possible</li>
                  <li>Secure packaging to prevent damage during transit</li>
                  <li>Include RA number prominently on package</li>
                  <li>Remove or cover old shipping labels</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Shipping Options:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li><strong>Our Pickup Service:</strong> We arrange pickup from your location (fees may apply)</li>
                  <li><strong>Customer Ships:</strong> You ship the item at your own cost</li>
                  <li><strong>Drop-off Centers:</strong> Return to authorized RepairMyBike centers</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Step 4: Inspection and Processing</h3>
              
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Quality Check:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Items inspected within 2-3 business days of receipt</li>
                  <li>Verification against return authorization</li>
                  <li>Assessment of item condition and completeness</li>
                  <li>Photo documentation of received items</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Processing Timeline:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Inspection: 2-3 business days</li>
                  <li>Refund/replacement processing: 3-5 business days</li>
                  <li>Total processing time: 5-8 business days</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Return Outcomes</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Full Refund</h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">When You Get Full Refund:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Item returned in perfect condition</li>
                  <li>Returned within specified time frame</li>
                  <li>All original accessories and packaging included</li>
                  <li>Valid reason for return</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Refund Method:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Refunded to original payment method</li>
                  <li>Processing time: 5-10 business days</li>
                  <li>Bank processing may take additional 2-3 days</li>
                  <li>Refund confirmation sent via email</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Replacement</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">When Replacement is Provided:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Defective item received</li>
                  <li>Wrong item shipped by us</li>
                  <li>Item damaged during shipping</li>
                  <li>Manufacturing defects discovered</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Replacement Process:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>New item shipped immediately after inspection</li>
                  <li>Priority processing for replacements</li>
                  <li>Tracking information provided</li>
                  <li>No additional shipping charges</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Partial Refund</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Reasons for Partial Refund:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Item returned without original packaging</li>
                  <li>Minor damage or wear noted</li>
                  <li>Missing accessories or documentation</li>
                  <li>Late return (within acceptable limits)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Deduction Factors:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Restocking fee: 10-20% of item value</li>
                  <li>Packaging replacement cost</li>
                  <li>Depreciation for condition</li>
                  <li>Administrative processing fee</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Return Rejection</h3>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">When Returns May Be Rejected:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Item not eligible for return per policy</li>
                  <li>Significant damage or misuse evident</li>
                  <li>Return initiated after deadline</li>
                  <li>Fraudulent return attempt</li>
                  <li>Item value disputes</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Shipping and Handling</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Return Shipping Costs</h3>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Customer Responsibility:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Returns due to change of mind</li>
                  <li>Incorrect ordering by customer</li>
                  <li>Items returned after trial period</li>
                  <li>Non-defective returns</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">RepairMyBike Covers Shipping:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Wrong item sent by us</li>
                  <li>Defective or damaged items received</li>
                  <li>Quality issues with the product</li>
                  <li>Shipping errors on our part</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Packaging Guidelines</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Use bubble wrap or protective material</li>
                <li>Ensure items cannot move inside box</li>
                <li>Seal packages securely</li>
                <li>Include return authorization number</li>
                <li>Keep shipping receipt until refund is processed</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Special Return Scenarios</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Warranty Returns</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Items under manufacturer warranty</li>
                <li>Different process than standard returns</li>
                <li>May require manufacturer authorization</li>
                <li>Longer processing times possible</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Bulk or Commercial Returns</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Special procedures for large quantity returns</li>
                <li>Account manager coordination required</li>
                <li>Potential for negotiated return terms</li>
                <li>Advanced authorization necessary</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">International Returns</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Additional documentation required</li>
                <li>Customs and duty considerations</li>
                <li>Extended processing times</li>
                <li>Restricted return shipping options</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Return Policy Exceptions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Holiday and Sale Periods</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Extended return periods during festivals</li>
                <li>Final sale items may not be returnable</li>
                <li>Special promotion terms may apply</li>
                <li>Modified processing times during peak seasons</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Discontinued Items</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Returns accepted but replacements may not be available</li>
                <li>Refund only option for discontinued products</li>
                <li>Credit notes for future purchases offered</li>
                <li>Extended return consideration period</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Customer Support for Returns</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Returns Department:</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>Phone: 8168-1217-11</li>
                      <li>Email: support@repairmybike.in</li>
                      <li>Hours: Monday-Saturday, 9 AM - 6 PM</li>
                      <li>Average response time: 4-6 hours during business hours</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Escalation Process:</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>Supervisor review for disputed returns</li>
                      <li>Management escalation available</li>
                      <li>Final decision communication in writing</li>
                      <li>Appeal process for rejected returns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Terms and Conditions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">General Terms</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>This policy is subject to change with notice</li>
                <li>Returns are subject to inspection and approval</li>
                <li>RepairMyBike reserves the right to refuse returns</li>
                <li>Policy applies to all RepairMyBike sales channels</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Legal Rights</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>This policy does not affect your statutory rights</li>
                <li>Consumer protection laws remain applicable</li>
                <li>Dispute resolution options available</li>
                <li>Jurisdiction: Courts of Rewari, Haryana</li>
              </ul>
            </section>

            {/* Footer */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-center text-gray-700 font-medium">
                For specific questions about returning an item, please contact our customer support team. 
                We're here to help ensure your complete satisfaction with RepairMyBike products and services.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
