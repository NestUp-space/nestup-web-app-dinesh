// frontend/src/components/landing-page/ServiceSection.tsx

"use client";
import React from 'react';
import { Clock, Settings, Puzzle, Eye } from 'lucide-react';

const ServiceSection = () => {
  const services = [
    {
      icon: Clock,
      title: "14 Days Delivery",
      description: "We promise to deliver your fully customized modular units within just 14 days, ensuring quality, precision, and complete satisfaction!",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100"
    },
    {
      icon: Settings,
      title: "End-to-End Service",
      description: "From concept to completion, we provide end-to-end solutions, managing every detail with care, expertise and unwavering commitment.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100"
    },
    {
      icon: Puzzle,
      title: "Custom Solutions",
      description: "Tailored designs crafted to perfectly match your unique needs, preferences, and style, ensuring every detail reflects your individuality.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100"
    },
    {
      icon: Eye,
      title: "Transparent Process",
      description: "No hidden costs or surprises—just honest communication and reliable service. An investment in a future of comfort, elegance, and functionality.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverColor: "hover:bg-orange-100"
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div 
                key={index}
                className="flex flex-col items-center text-center group cursor-pointer transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`w-20 h-20 rounded-full ${service.bgColor} ${service.hoverColor} flex items-center justify-center transition-all duration-300 group-hover:shadow-lg`}>
                  <IconComponent 
                    className={`w-10 h-10 ${service.color} transition-transform duration-300 group-hover:scale-110`}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 transition-colors duration-300 group-hover:text-gray-700">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServiceSection;
