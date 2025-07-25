import React from 'react';

interface ProcessCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  stepNumber: number;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ title, description, icon, stepNumber }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transform transition duration-300 hover:scale-105 hover:shadow-xl">
      <div className="w-12 h-12 bg-theme-color text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
        {stepNumber}
      </div>
      <h3 className="text-xl font-semibold text-dark-text mb-2">{title}</h3>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
};

export default ProcessCard;
