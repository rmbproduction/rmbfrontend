import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
              RepairMyBike - Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                RepairMyBike is committed to protecting your privacy and personal information. This privacy policy 
                explains how we collect, use, store, and protect your data when you use our doorstep two-wheeler 
                repair services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Contact Details:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Full name</li>
                  <li>Phone number</li>
                  <li>Email address</li>
                  <li>Home/service address</li>
                  <li>Alternative contact information</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Account Information:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>User ID and password</li>
                  <li>Profile preferences</li>
                  <li>Service history and preferences</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Vehicle Information</h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Technical Details:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Vehicle make and model</li>
                  <li>Year of manufacture</li>
                  <li>Engine specifications</li>
                  <li>Vehicle identification number (where required)</li>
                  <li>Previous service history</li>
                  <li>Current vehicle condition and issues</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Transaction Information</h3>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Payment Data:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Payment method details (processed securely through certified third-party payment gateways)</li>
                  <li>Billing address</li>
                  <li>Transaction history</li>
                  <li>Invoice and receipt information</li>
                </ul>
                <p className="text-purple-600 text-sm mt-2">
                  <strong>Note:</strong> We do not store complete credit card or banking details on our servers.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Technical Information</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Device and Usage Data:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>IP address</li>
                  <li>Device type and operating system</li>
                  <li>Browser type and version</li>
                  <li>App usage patterns</li>
                  <li>Location data (when location services are enabled)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service-Related Information</h3>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-4">
                <h4 className="font-semibold text-indigo-800 mb-2">Booking Details:</h4>
                <ul className="list-disc list-inside text-indigo-700 space-y-1">
                  <li>Service requests and bookings</li>
                  <li>Technician notes and service reports</li>
                  <li>Photos of vehicle condition (before and after service)</li>
                  <li>Customer feedback and ratings</li>
                  <li>Communication logs with customer support</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Primary Purposes</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Service Delivery:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Schedule and confirm appointments</li>
                  <li>Assign appropriate technicians</li>
                  <li>Provide doorstep repair services</li>
                  <li>Process payments and generate invoices</li>
                  <li>Maintain service records</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Communication:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Send booking confirmations and reminders</li>
                  <li>Provide service updates and notifications</li>
                  <li>Share technician arrival information</li>
                  <li>Follow up on service quality</li>
                  <li>Respond to customer inquiries and support requests</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Quality Improvement:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Analyze service performance</li>
                  <li>Improve our processes and offerings</li>
                  <li>Train our technicians</li>
                  <li>Develop new services based on customer needs</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Secondary Purposes</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Marketing (with your consent only):</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Send promotional offers and discounts</li>
                  <li>Inform about new services or features</li>
                  <li>Share maintenance tips and recommendations</li>
                  <li>Send newsletter and updates</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">Legal and Compliance:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Comply with legal obligations</li>
                  <li>Prevent fraud and unauthorized access</li>
                  <li>Resolve disputes and legal claims</li>
                  <li>Maintain records for regulatory requirements</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">We Share Information With:</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Service Partners:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Technicians (only information necessary for service delivery)</li>
                  <li>Spare parts suppliers (for order fulfillment)</li>
                  <li>Payment processors (for transaction processing)</li>
                  <li>Logistics partners (for parts delivery)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Legal Requirements:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Government authorities when required by law</li>
                  <li>Law enforcement agencies for legal investigations</li>
                  <li>Courts and legal professionals for dispute resolution</li>
                  <li>Regulatory bodies as per compliance requirements</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">We Never:</h3>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Sell your personal information to third parties</li>
                  <li>Share your data for third-party marketing without consent</li>
                  <li>Disclose your information for commercial purposes unrelated to our services</li>
                  <li>Transfer data to unauthorized parties</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Security Measures</h3>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">Technical Safeguards:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>SSL encryption for data transmission</li>
                  <li>Secure servers with firewall protection</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication systems</li>
                  <li>Data backup and recovery systems</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Operational Safeguards:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Employee training on data protection</li>
                  <li>Limited access on need-to-know basis</li>
                  <li>Regular review of security procedures</li>
                  <li>Incident response protocols</li>
                  <li>Vendor security assessments</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Breach Response</h3>
              <p className="text-gray-700 mb-3">In case of a data breach:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Immediate containment and assessment</li>
                <li>Notification to affected customers within 72 hours</li>
                <li>Cooperation with regulatory authorities</li>
                <li>Implementation of additional security measures</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Access and Control</h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">You Have the Right to:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Access all personal information we hold about you</li>
                  <li>Request correction of inaccurate or incomplete data</li>
                  <li>Update your contact and preference information</li>
                  <li>Download your data in a portable format</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Deletion and Restriction</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">You Can Request:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Complete deletion of your account and data</li>
                  <li>Removal of specific information</li>
                  <li>Restriction of processing for certain purposes</li>
                  <li>Temporary suspension of your account</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Communication Preferences</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">You Can:</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Opt out of promotional emails and SMS</li>
                  <li>Choose specific types of communications</li>
                  <li>Update notification preferences</li>
                  <li>Unsubscribe from newsletters</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">How to Exercise Your Rights</h3>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Contact Methods:</h4>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>Through your account settings in our app/website</li>
                  <li>Email our privacy team at [privacy email]</li>
                  <li>Call our customer support</li>
                  <li>Submit a written request to our office address</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Retention Periods</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Active Customer Data:</strong> Retained while your account is active</li>
                <li><strong>Transaction Records:</strong> 7 years for financial and legal compliance</li>
                <li><strong>Service History:</strong> 3 years for warranty and service purposes</li>
                <li><strong>Communication Logs:</strong> 2 years for quality and dispute resolution</li>
                <li><strong>Marketing Data:</strong> Until you opt out or request deletion</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Deletion Process</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Automatic deletion after retention periods</li>
                <li>Manual deletion upon customer request</li>
                <li>Secure destruction of physical records</li>
                <li>Verification of complete data removal</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Types of Cookies Used</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for website/app functionality</li>
                <li><strong>Performance Cookies:</strong> Help us improve our services</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and choices</li>
                <li><strong>Marketing Cookies:</strong> Used for promotional communications (with consent)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Managing Cookies</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Disable cookies through browser settings</li>
                <li>Opt out of marketing cookies</li>
                <li>Clear existing cookies anytime</li>
                <li><strong>Note:</strong> Disabling essential cookies may affect functionality</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                If we transfer your data outside India, adequate protection measures will be implemented, 
                compliance with applicable data protection laws will be ensured, contractual safeguards 
                with international partners will be established, and notification of any significant 
                changes in data handling will be provided.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                RepairMyBike services are intended for users 18 years and older. We do not knowingly collect 
                personal information from children under 18. If we become aware of such collection, we will 
                delete the information immediately.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Policy Updates</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Material changes will be notified via email or app notification</li>
                <li>Minor updates will be posted on our website</li>
                <li>Continued use after changes indicates acceptance</li>
                <li>Previous policy versions available upon request</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Privacy Inquiries</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Data Protection Officer:</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>Email: support@repairmybike.in</li>
                      <li>Phone: 8168-1217-11</li>
                      <li>Address: Shop no. 3 Automarket REWARI , Pin 123401 Street no. 1 HARYANA</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">General Support:</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>Website: https://repairmybike.in</li>
                      <li>Customer Service: support@repairmybike.in</li>
                      <li>Business Hours: Shop no. 3 Automarket REWARI , Pin 123401 Street no. 1 HARYANA</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Regulatory Authority</h3>
              <p className="text-gray-700 mb-4">
                For complaints about data handling, you can also contact the relevant data protection authority 
                in your jurisdiction.
              </p>
            </section>

            {/* Footer */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-center text-gray-700 font-medium">
                This privacy policy is effective as of the date mentioned above. By using RepairMyBike services, 
                you acknowledge that you have read and understood this policy.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
