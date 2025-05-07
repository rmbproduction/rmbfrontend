import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, PenTool as Tool, Clock } from 'lucide-react';

const About = () => {
  const stats = [
    // { icon: Users, label: 'Happy Customers', value: '10,000+' },
    // { icon: Tool, label: 'Repairs Completed', value: '25,000+' },
    // { icon: Clock, label: 'Years of Experience', value: '15+' },
    // { icon: Award, label: 'Service Awards', value: '20+' },
  ];

  const team = [
    // {
    //   name: 'John Smith',
    //   role: 'Master Mechanic',
    //   image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    //   bio: '15 years of experience in bike repairs and maintenance.',
    // },
    // {
    //   name: 'Sarah Johnson',
    //   role: 'Service Manager',
    //   image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    //   bio: 'Expert in customer service and team management.',
    // },
    // {
    //   name: 'Michael Chen',
    //   role: 'Technical Specialist',
    //   image: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    //   bio: 'Specialized in modern bike electronics and diagnostics.',
    // },
    // {
    //   name: 'Michael Chen',
    //   role: 'Technical Specialist',
    //   image: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80',
    //   bio: 'Specialized in modern bike electronics and diagnostics.',
    // },
   
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900">About RepairMyBike</h1>
          <p className="mt-4 text-xl text-gray-600">Your trusted partner in bike care and maintenance</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="prose prose-lg text-gray-600">
              <p className="mb-4">
                Founded in May 2025, RepairMyBike emerged from a father-son legacy of bike repair expertise. The story began with Rajesh Singh, a dedicated bike mechanic who built his reputation through decades of honest service and technical mastery. His passion for fixing bikes and helping people, even without a formal shop, laid the foundation for what would become RepairMyBike.
              </p>
              <p className="mb-4">
                Following in his father's footsteps, Mohit Singh from Rewari, Haryana, understood the core values that made his father's work so impactful. Together with partners Mahir, Harish, and Vikash Bhatia, Mohit transformed his father's customer-first approach into RepairMyBike in 2025 - a service designed to eliminate all hassles associated with bike repairs.
              </p>
              <p className="mb-4">
                Our mission reflects the values Rajesh Singh instilled: we aim to completely remove the stress and headache of bike repairs from our customers' lives. Through our door-to-door pickup and drop service, expert mechanics, and home service options, we ensure you never have to worry about your bike's maintenance or repairs again.
              </p>
              <p>
                At RepairMyBike, we've modernized the traditional repair experience while maintaining the trust and personal touch that Rajesh Singh was known for. Just request a service, and let us handle everything else - that's our promise to you.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            <img
              src="/assets/founder.jpg"
              alt="RepairMyBike Founder"
              className="rounded-2xl shadow-lg w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/assets/bikeExpert.jpg";
              }}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF5F2] rounded-full mb-4">
                  <IconComponent className="w-8 h-8 text-[#FF5733]" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {/* <h2 className="text-3xl font-bold text-center mb-12">Our Expert Team</h2> */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr justify-items-center">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 * index }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col w-full max-w-sm"
                >
                  <div className="aspect-w-4 aspect-h-3 w-full">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-[#FF5733] font-medium mb-2">{member.role}</p>
                    <p className="text-gray-600 flex-grow">{member.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;