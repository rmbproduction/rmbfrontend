import React from 'react';
import { motion } from 'framer-motion';

const ShippingPolicy = () => {
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
              RepairMyBike - Shipping Policy
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
                This shipping policy covers the delivery of spare parts, accessories, and products ordered through 
                RepairMyBike, as well as our doorstep service delivery terms.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Delivery</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Doorstep Repair Services</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Scheduling:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Services scheduled based on technician availability</li>
                  <li>Confirmation call 1-2 hours before arrival</li>
                  <li>Standard service hours: 8:00 AM - 8:00 PM</li>
                  <li>Weekend and holiday services available (additional charges may apply)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Service Areas:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Primary coverage areas listed on our website</li>
                  <li>Service availability confirmed during booking</li>
                  <li>Remote location services subject to additional charges</li>
                  <li>Some areas may have limited service days</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Arrival and Setup:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Technician arrives with necessary tools and equipment</li>
                  <li>Professional identification and uniform</li>
                  <li>Vehicle setup and safety preparations</li>
                  <li>Pre-service vehicle inspection and consultation</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Delivery Terms</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Customer Availability:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Customer or authorized person must be present</li>
                  <li>Rescheduling required if customer unavailable</li>
                  <li>First reschedule: No additional charge</li>
                  <li>Subsequent reschedules: ₹100-200 rescheduling fee</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Access Requirements:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Safe and accessible vehicle location</li>
                  <li>Adequate lighting for service work</li>
                  <li>Clear workspace around the vehicle</li>
                  <li>Parking or service area suitable for repair work</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Spare Parts Shipping</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Delivery Timeline</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Standard Delivery:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Metro cities: 2-4 business days</li>
                  <li>Tier 2 cities: 3-5 business days</li>
                  <li>Tier 3 cities and rural areas: 5-7 business days</li>
                  <li>Remote locations: 7-10 business days</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Express Delivery:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Metro cities: Next business day</li>
                  <li>Major cities: 1-2 business days</li>
                  <li>Additional charges apply</li>
                  <li>Subject to product availability and cutoff times</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Same-Day Delivery:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Available in select metro areas</li>
                  <li>Order before 12:00 PM for same-day delivery</li>
                  <li>Premium charges apply</li>
                  <li>Limited to in-stock items only</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Order Processing Time</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Standard Processing:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Order confirmation: Within 2 hours</li>
                  <li>Inventory verification: 4-6 hours</li>
                  <li>Packaging and dispatch: 24-48 hours</li>
                  <li>Weekends may extend processing by 1-2 days</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Express Processing:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Priority handling for express orders</li>
                  <li>Same-day dispatch for orders before 2:00 PM</li>
                  <li>Weekend processing available for urgent orders</li>
                  <li>Additional processing fees may apply</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Shipping Charges</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Standard Shipping Rates</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Free Shipping:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Orders above ₹1,500 (may vary by promotion)</li>
                  <li>Applicable in primary service areas</li>
                  <li>Standard delivery timeline applies</li>
                  <li>Free shipping promotions as announced</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Paid Shipping:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Orders below free shipping threshold: ₹50-150</li>
                  <li>Rate based on weight, size, and destination</li>
                  <li>Calculated at checkout before payment</li>
                  <li>No hidden charges or surprises</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Premium Shipping Options</h3>
              
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Express Delivery:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Additional ₹100-300 based on location</li>
                  <li>Faster processing and priority handling</li>
                  <li>Real-time tracking provided</li>
                  <li>Delivery attempt guarantee</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Same-Day Delivery:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>₹200-500 depending on distance and urgency</li>
                  <li>Available in select areas only</li>
                  <li>Cut-off time restrictions apply</li>
                  <li>Direct delivery by RepairMyBike team</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Special Handling Charges</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Large/Heavy Items:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Items over 25kg: Additional ₹100-200</li>
                  <li>Bulky items requiring special packaging</li>
                  <li>Two-person delivery requirement</li>
                  <li>Advance scheduling necessary</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Fragile Items:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Special packaging charges: ₹50-100</li>
                  <li>Extra insurance coverage included</li>
                  <li>Careful handling protocols</li>
                  <li>Photo documentation of packaging</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Shipping Areas and Restrictions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Coverage Areas</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Primary Service Areas:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Major metro cities and surrounding areas</li>
                  <li>Full service and shipping availability</li>
                  <li>Standard delivery timelines apply</li>
                  <li>All payment and delivery options available</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Secondary Service Areas:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Tier 2 and Tier 3 cities</li>
                  <li>Extended delivery timelines</li>
                  <li>Some shipping restrictions may apply</li>
                  <li>Limited payment options in some areas</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Limited Service Areas:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Remote and rural locations</li>
                  <li>Longer delivery times expected</li>
                  <li>Additional shipping charges applicable</li>
                  <li>Service subject to availability</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Shipping Restrictions</h3>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Items We Cannot Ship:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Hazardous materials (batteries, chemicals)</li>
                  <li>Flammable liquids and gases</li>
                  <li>Items restricted by courier partners</li>
                  <li>Products banned in specific states/regions</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Address Limitations:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>PO Box addresses (in most cases)</li>
                  <li>Military addresses (special procedures)</li>
                  <li>Addresses without proper landmarks</li>
                  <li>Locations inaccessible to delivery vehicles</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Order Tracking and Updates</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Tracking Information</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Order Confirmation:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Immediate order confirmation via SMS/email</li>
                  <li>Order number for future reference</li>
                  <li>Expected delivery date provided</li>
                  <li>Payment confirmation details</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Shipping Notifications:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Dispatch confirmation with tracking number</li>
                  <li>Carrier information and contact details</li>
                  <li>Estimated delivery date and time slot</li>
                  <li>Link to track shipment online</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Delivery Updates:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>SMS/call before delivery attempt</li>
                  <li>Real-time delivery status updates</li>
                  <li>Delivery confirmation with recipient details</li>
                  <li>Electronic delivery receipt</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Tracking Methods</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Online Tracking:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>RepairMyBike website tracking portal</li>
                  <li>Mobile app tracking feature</li>
                  <li>Third-party courier tracking systems</li>
                  <li>WhatsApp tracking updates</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Customer Service:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Phone support for tracking assistance</li>
                  <li>Live chat tracking help</li>
                  <li>Email updates on request</li>
                  <li>Social media support channels</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Delivery Process</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Standard Delivery Procedure</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Before Delivery:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Delivery partner contacts customer</li>
                  <li>Delivery time confirmation</li>
                  <li>Address verification if needed</li>
                  <li>Special delivery instructions noted</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">During Delivery:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Verification of recipient identity</li>
                  <li>Product condition check before handover</li>
                  <li>Packaging inspection opportunity</li>
                  <li>Electronic signature or OTP confirmation</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">After Delivery:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Delivery confirmation SMS/email</li>
                  <li>Customer feedback request</li>
                  <li>Return policy information shared</li>
                  <li>Installation service booking option</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Delivery Failure Procedures</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">First Attempt Failure:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Second delivery attempt next business day</li>
                  <li>Customer notification and rescheduling option</li>
                  <li>No additional charges for redelivery</li>
                  <li>Extended delivery window offered</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Multiple Attempt Failures:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Item held at local delivery center</li>
                  <li>Customer pickup option available</li>
                  <li>Return to sender after 5-7 days</li>
                  <li>Reshipment charges may apply for new delivery</li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Damaged or Missing Shipments</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Reporting Damage</h3>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Immediate Reporting:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Report damage within 24 hours of delivery</li>
                  <li>Photo evidence of damaged packaging/items</li>
                  <li>Retain all packaging materials</li>
                  <li>Contact customer service immediately</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Damage Assessment:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>RepairMyBike team investigates claim</li>
                  <li>Courier partner liability assessment</li>
                  <li>Replacement or refund decision</li>
                  <li>Priority processing for confirmed damage</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Missing Shipments</h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Investigation Process:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Tracking verification and analysis</li>
                  <li>Courier partner investigation initiated</li>
                  <li>Police complaint for high-value items</li>
                  <li>Customer kept informed throughout process</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Resolution Options:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Replacement shipment for confirmed losses</li>
                  <li>Full refund if replacement unavailable</li>
                  <li>Insurance claim processing assistance</li>
                  <li>Expedited processing for critical items</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Shipping</h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Currently Not Available</h3>
                <p className="text-yellow-700 mb-2">
                  RepairMyBike currently does not offer international shipping. We serve customers within India only.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Future Plans</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>International expansion under consideration</li>
                <li>Specific country partnerships being evaluated</li>
                <li>Regulatory compliance requirements being studied</li>
                <li>Customer interest being assessed</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Special Delivery Services</h2>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Installation Delivery:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Technician delivers and installs part</li>
                  <li>Combined delivery and service appointment</li>
                  <li>Professional installation guarantee</li>
                  <li>Same-day service in select areas</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Corporate Delivery:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Bulk order delivery services</li>
                  <li>Scheduled delivery appointments</li>
                  <li>Direct delivery to workshops/garages</li>
                  <li>Customized delivery solutions</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Emergency Delivery:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Urgent breakdown assistance</li>
                  <li>Priority processing and delivery</li>
                  <li>Premium charges for emergency service</li>
                  <li>Limited to critical parts availability</li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Shipping Support</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Delivery Inquiries:</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>Phone: 8168-1217-11</li>
                      <li>Email: support@repairmybike.in</li>
                      <li>WhatsApp: 8168-1217-11</li>
                      {/* <li>Live Chat: Available on website and app</li> */}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Tracking Assistance:</h4>
                    <ul className="space-y-1 text-blue-600">
                      {/* <li>Automated tracking: [website/app tracking page]</li> */}
                      <li>Customer service hours: 9:00 AM - 7:00 PM (Mon-Sat)</li>
                      <li>Emergency contact: 8168-1217-11</li>
                      <li>Social media: Facebook, Instagram, Twitter</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Address Changes</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Contact within 2 hours of order placement</li>
                <li>Address modification fees may apply</li>
                <li>Same-city changes: Usually possible</li>
                <li>Inter-city changes: Subject to approval and additional charges</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Terms and Conditions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Delivery Terms</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Delivery timelines are estimates, not guarantees</li>
                <li>Delays due to weather, natural disasters, or force majeure events are not covered under service guarantees</li>
                <li>RepairMyBike reserves the right to choose delivery partners</li>
                <li>Special handling requirements must be communicated during ordering</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Customer Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide accurate and complete delivery address</li>
                <li>Ensure someone is available to receive the delivery</li>
                <li>Inspect items immediately upon delivery</li>
                <li>Report any issues within specified time frames</li>
                <li>Arrange for safe storage of delivered items</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Liability</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>RepairMyBike's liability is limited to the value of shipped items</li>
                <li>Customer responsible for items after successful delivery</li>
                <li>Insurance coverage available for high-value shipments</li>
                <li>Force majeure events exclude RepairMyBike from delivery guarantees</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Policy Updates</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Shipping policy subject to change with prior notice</li>
                <li>Customers notified of significant changes</li>
                <li>Updated policies apply to new orders</li>
                <li>Existing orders governed by policy at time of purchase</li>
              </ul>
            </section>

            {/* Footer */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-center text-gray-700 font-medium">
                For the most current shipping rates and delivery timelines, please check our website or contact 
                customer service. RepairMyBike is committed to providing reliable and efficient delivery services 
                for all your two-wheeler maintenance needs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
