import React from "react";

const processItems = [
  {
    imgSrc: "../img/measure.png",
    imgAlt: "laser scale",
    title: "MM Accurate site measurements",
    text: "We start by understanding your unique needs and preferences. Our design team collaborates with you to create a customized plan that aligns with your vision. Using advanced design software, we provide you with detailed 3D models and blueprints."
  },
  {
    imgSrc: "../img/checklist.png",
    imgAlt: "checklist",
    title: "Detailed Material Estimates",
    text: "Once the design is finalized, we begin the manufacturing process in our state-of-the-art factory. Each module is constructed with precision and care, ensuring top-notch quality and durability. Our use of sustainable materials and energy-efficient methods reflects our commitment to the environment."
  },
  {
    imgSrc: "../img/automation.png",
    imgAlt: "automation",
    title: "Highly precised panel processing",
    text: "After manufacturing, the modular units are transported to your desired location. Our team of experts handles the installation process, ensuring that everything is set up seamlessly and efficiently. The modular nature of our units allows for quick assembly, minimizing disruption and saving time."
  },
  {
    imgSrc: "../img/installation.png",
    imgAlt: "installation",
    title: "Expert Installation Team",
    text: "Finally, we add the finishing touches to your modular space, from interior design to final inspections. We ensure that every detail is perfect and that your new space is ready for use. Our goal is to deliver a product that exceeds your expectations and provides a comfortable, functional environment."
  }
];

export function ProcessSection() {
  return (
    <section className="index-section" id="process">
      <div className="sectionheader">
        <h1>How it works</h1>
      </div>
      <div className="process-flex">
        {processItems.map((item, index) => (
          <div key={index} className="process-item">
            <div className="process-img">
              <img src={item.imgSrc} alt={item.imgAlt} />
            </div>
            <div className="process-text">
              <p>
                <span className="bold-text">{item.title}:</span> {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
