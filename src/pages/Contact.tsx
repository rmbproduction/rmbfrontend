import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      for (const field in errors) {
        toast.error(errors[field]);
      }
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the API base URL from environment variables or use default
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
      
      // Log the data being sent for debugging
      console.log('Sending contact form data:', formData);
      
      // Send the form data to the contact API endpoint
      const response = await axios.post(`${baseUrl}accounts/contact/`, formData);
      
      // Show success message
      toast.success(response.data.message || 'Your message has been sent successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      // Show animated notification
      setShowNotification(true);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
        // Set submitted flag for success message
        setSubmitted(true);
      }, 5000);
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      
      // Show detailed error message for debugging
      if (error.response) {
        console.log('Error response data:', error.response.data);
        
        // Extract detailed error message
        let errorMessage = 'Failed to send message. Please try again.';
        
        if (error.response.data) {
          if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.details) {
            errorMessage = typeof error.response.data.details === 'string' 
              ? error.response.data.details 
              : JSON.stringify(error.response.data.details);
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else {
            // Try to find any error messages in the response data
            const data = error.response.data;
            for (const key in data) {
              if (Array.isArray(data[key])) {
                errorMessage = `${key}: ${data[key].join(', ')}`;
                break;
              }
            }
          }
        }
        
        toast.error(errorMessage);
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="py-20 bg-gray-50 relative">
      {/* Animated Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="fixed top-10 inset-x-0 z-50 flex justify-center"
          >
            <div className="bg-white py-4 px-6 rounded-lg shadow-lg border-l-4 border-[#FF5733] flex items-center max-w-lg">
              <CheckCircle className="text-green-500 h-6 w-6 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Thank you for your message!</h3>
                <p className="text-gray-600">You will get a response on your email soon.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-4 text-xl text-gray-600">Get in touch with our expert team</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {submitted ? (
              <div className="text-center py-10">
                <div className="text-[#FF5733] mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-4">Thank You!</h2>
                <p className="text-gray-600 mb-6">Your message has been received. We'll contact you soon.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#FF5733] text-white py-2 px-4 rounded-lg hover:bg-[#ff4019] transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring focus:ring-[#FF5733] focus:ring-opacity-50"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring focus:ring-[#FF5733] focus:ring-opacity-50"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring focus:ring-[#FF5733] focus:ring-opacity-50"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring focus:ring-[#FF5733] focus:ring-opacity-50"
                      required
                      disabled={loading}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className={`w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-[#FF5733] mt-1" />
                  <div className="ml-4">
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-gray-600">+91 816 812 1711</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-[#FF5733] mt-1" />
                  <div className="ml-4">
                    <h3 className="font-medium">Email</h3>
                    <p className="text-gray-600">support@repairmybike.in</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-[#FF5733] mt-1" />
                  <div className="ml-4">
                    <h3 className="font-medium">Address</h3>
                    <p className="text-gray-600">Gali no.1 Shop no.1Automarket,Rewari, Haryana, India</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-[#FF5733] mt-1" />
                  <div className="ml-4">
                    <h3 className="font-medium">Working Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Emergency Service</h2>
              <p className="text-gray-600 mb-4">
                Need urgent bike repair? Our emergency team is available 24/7.
              </p>
              <button className="w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors">
                Call Emergency Service
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;