import React from 'react';
import { Plane, Hotel, Map as MapIcon, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export const Travel: React.FC = () => {
  const services = [
    {
      icon: Plane,
      title: 'Flight Booking',
      description: 'Search and book flights worldwide',
    },
    {
      icon: Hotel,
      title: 'Hotels',
      description: 'Find the perfect accommodation',
    },
    {
      icon: MapIcon,
      title: 'Destinations',
      description: 'Explore popular travel destinations',
    },
    {
      icon: Compass,
      title: 'Travel Guides',
      description: 'Get expert travel recommendations',
    },
  ];

  return (
    <div className="flex-1 p-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <Plane className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">Travel Services</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <motion.div
              key={service.title}
              whileHover={{ scale: 1.02 }}
              className="bg-dark-lighter p-6 rounded-xl border border-dark-light hover:border-primary/50 transition-colors"
            >
              <service.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
              <p className="text-gray-400">{service.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 bg-dark-lighter rounded-xl p-6 border border-dark-light">
          <h2 className="text-2xl font-semibold text-white mb-4">Featured Destinations</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {['Tokyo', 'Paris', 'New York'].map((city) => (
              <motion.div
                key={city}
                whileHover={{ scale: 1.05 }}
                className="aspect-video rounded-lg bg-dark flex items-center justify-center cursor-pointer"
              >
                <span className="text-lg font-medium">{city}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};