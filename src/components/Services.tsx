import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getIconForCategory } from '../data/services';

interface ServiceCategory {
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
}

const Services = () => {
  const navigate = useNavigate();
  
  const { data: categories, isLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const response = await fetch('https://repairmybike.up.railway.app/api/repairing-service/service-categories/');
      const data = await response.json();
      return data;
    }
  });

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Services</h2>
          <p className="mt-4 text-xl text-gray-500">Professional bike care services at your doorstep</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories?.map((category, index) => {
            const IconComponent = getIconForCategory(category.slug);
            return (
              <motion.div
                key={category.uuid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
                onClick={() => navigate(`/service/${category.uuid}`)}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-[#FFF5F2] rounded-lg text-[#FF5733] mb-4">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-500">{category.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Services;