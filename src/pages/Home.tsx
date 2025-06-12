import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import FeaturedSpareParts from '../components/FeaturedSpareParts';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Services />
      <FeaturedSpareParts />
      <HowItWorks />
    </div>
  );
};

export default Home; 