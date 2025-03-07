import React from 'react';
import { Building2, FileText, Users, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export const Government: React.FC = () => {
  const services = [
    {
      icon: FileText,
      title: 'Document Services',
      description: 'Apply for certificates, licenses, and permits',
    },
    {
      icon: Users,
      title: 'Citizen Services',
      description: 'Access public services and benefits',
    },
    {
      icon: Landmark,
      title: 'Municipal Services',
      description: 'Pay taxes and access local government services',
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
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">Government Services</h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </motion.div>
    </div>
  );
};