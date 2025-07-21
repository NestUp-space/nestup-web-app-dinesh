// frontend/src/components/landing-page/ProjectSection.tsx

"use client";
import React from 'react';

const ProjectSection = () => {
  return (
    <div className="bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">
          Our Projects
        </h2>
        <div className="mt-6 flex justify-center">
          <button className="px-4 py-2 rounded-full bg-white text-gray-700 font-medium">
            Bedroom
          </button>
          <button className="ml-4 px-4 py-2 rounded-full bg-white text-gray-700 font-medium">
            Kitchen
          </button>
          <button className="ml-4 px-4 py-2 rounded-full bg-white text-gray-700 font-medium">
            Living
          </button>
          <button className="ml-4 px-4 py-2 rounded-full bg-white text-gray-700 font-medium">
            Bathroom
          </button>
        </div>
        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Project 1 */}
          <div className="bg-white rounded-lg overflow-hidden">
            <img src="/img/project1.png" alt="Project 1" />
          </div>
          {/* Project 2 */}
          <div className="bg-white rounded-lg overflow-hidden">
            <img src="/img/project2.png" alt="Project 2" />
          </div>
          {/* Project 3 */}
          <div className="bg-white rounded-lg overflow-hidden">
            <img src="/img/project3.png" alt="Project 3" />
          </div>
          {/* Project 4 */}
          <div className="bg-white rounded-lg overflow-hidden">
            <img src="/img/project4.png" alt="Project 4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSection;
