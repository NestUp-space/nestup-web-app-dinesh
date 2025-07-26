import React from "react";
import Image from "next/legacy/image"; // Import the Image component

const processItems = [
  {
    imgSrc: "/img/measure.png", // Use the path relative to the public directory
    imgAlt: "laser scale",
    title: "Accurate site measurements",
    text: "We begin by thoroughly understanding your site. Our professional measurement team visits your location and uses advanced laser measurement tools to scan the walls and capture all necessary details. This includes beams, columns, switchboard positions, and any surface undulations.",
  },
  {
    imgSrc: "/img/checklist.png",
    imgAlt: "checklist",
    title: "Detailed Material Estimates",
    text: "After gathering the measurements, we proceed with the designs that you have finalized with your client. Using our proprietary software, we create a detailed 3D modular model, plank by plank, down to the finest details such as holes and dimensions. This process generates precise material estimates and cut lists, ensuring accuracy at every stage",
  },
  {
    imgSrc: "/img/automation.png",
    imgAlt: "automation",
    title: "Precise Factory Production",
    text: "Once the design is approved, we move to the manufacturing phase at our state-of-the-art facility. Each module is meticulously crafted to ensure the highest quality and durability. After production, the materials are organized into unit-specific packages and go through a rigorous quality control process.",
  },
  {
    imgSrc: "/img/installation.png",
    imgAlt: "installation",
    title: "Expert Installation Team",
    text: "After production, the modular units are delivered to your specified location. We can recommend highly trained third-party installation teams for you to hire, or if you already have a team, we provide a comprehensive installation guide. Additionally, we can assign a site engineer to help train your team and ensure a smooth installation process.",
  },
];

export function DetailedProcess() {
  return (
    <section className= "w-screen p-5 md:px-20 lg:px-40 " id="process">
      <div className="text-theme-color text-3xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20 mt-8 flex items-center">
        <h1>How we work</h1>
      </div>
      <div className="flex-col ">
        {processItems.map((item, index) => (
          <div key={index} className="grid grid-cols-5 gap-6 m-3">
            <div className="col-span-1">
              <Image
                className="p-1 md:p-3 border-2 border-theme-dark bg-white rounded-sm"
                src={item.imgSrc}
                alt={item.imgAlt}
                width={150} // specify a width
                height={150} // specify a height
              />
            </div>
            <div className="flex col-span-4 bg-white items-center p-8 rounded-sm">
              <p>
                <span className="text-theme-color font-bold">{item.title}:</span> {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
