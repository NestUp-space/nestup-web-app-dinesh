// frontend/src/components/landing-page/ProjectSection.tsx

"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const projectImages = [
  {
    name: "Bedroom",
    images: [
      "/img/siteImages/bedroom-1.jpeg",
      "/img/siteImages/Bedroom-2.jpeg",
      "/img/siteImages/Bedroom-3.jpeg",
      "/img/siteImages/Bedroom-4.jpeg",
    ],
  },
  {
    name: "Kitchen",
    images: [
      "/img/siteImages/Kitchen - 1.jpeg",
      "/img/siteImages/Kitchen - 2.jpeg",
      "/img/siteImages/Kitchen - 3.jpeg",
      "/img/siteImages/Kitchen - 4.jpeg",
    ],
  },
  {
    name: "Living",
    images: [
      "/img/siteImages/livingRoom-1.jpeg",
      "/img/siteImages/livingRoom-2.jpeg",
      "/img/siteImages/livingRoom-3.jpeg",
      "/img/siteImages/livingRoom-4.jpeg",
    ],
  },
];

const ProjectSection = () => {
  const [selectedRoom, setSelectedRoom] = useState(projectImages[0].name);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % projectImages.length);
      setSelectedRoom(projectImages[(currentImageIndex + 1) % projectImages.length].name);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  return (
    <div className="bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">
          Our Projects
        </h2>
        <div className="mt-6 flex justify-center">
          {projectImages.map((room) => (
            <button
              key={room.name}
              className={`px-4 py-2 mx-5 rounded-full text-gray-700 font-medium ${
                selectedRoom === room.name ? 'bg-theme-color text-white' : 'bg-white'
              }`}
              onClick={() => setSelectedRoom(room.name)}
            >
              {room.name}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {projectImages
            .find((room) => room.name === selectedRoom)
            ?.images.map((image, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden relative h-[400px]">
                <Image src={image} alt={`${selectedRoom} ${index + 1}`} layout="fill" objectFit="cover" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectSection;
