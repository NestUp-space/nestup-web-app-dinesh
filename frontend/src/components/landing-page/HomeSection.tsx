
"use client";

import React, { useEffect, useRef } from "react";
import { CTAButton } from "./CTAButton";
import Image from "next/image";
import bgImg from "@img/homeBg.jpeg";
import ReviewSection from "./ReviewSection";
import ServiceSection from "./ServiceSection";
import ProjectSection from "./ProjectSection";
import ProcessSection from "./ProcessSection";
import FooterSection from "./FooterSection";

export function HomeSection() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function printLetterByLetter(
      destination: string,
      message: string,
      speed: number,
      callback: () => void
    ) {
      let i = 0;
      const destinationElement = document.getElementById(destination);

      // Ensure the element is cleared before starting
      if (destinationElement) {
        destinationElement.innerHTML = "";
      }

      intervalRef.current = setInterval(() => {
        if (destinationElement) {
          // Append one character at a time
          if (message.charAt(i) === "\n") {
            destinationElement.innerHTML += "<br>";
          } else {
            destinationElement.innerHTML += message.charAt(i);
          }
          i++;
          if (i >= message.length) {
            clearInterval(intervalRef.current!);
            if (callback && typeof callback === "function") {
              callback();
            }
          }
        }
      }, speed);
    }

    const message = "From Site measurement to Installation\nin 14 working days\nat ₹320 per sqft";

    printLetterByLetter("pitch", message, 50, () => {
      const ctaElements = document.getElementsByClassName("CTA");
      for (let j = 0; j < ctaElements.length; j++) {
        const element = ctaElements[j] as HTMLElement; // Cast to HTMLElement
        setTimeout(() => {
          element.style.visibility = "visible";
        }, j * 100);
      }
    });

    // Return a cleanup function to clear intervals when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return (
    <section className="flex flex-col" id="home">
      <div className= "h-dvh flex">
        <div className="absolute flex items-center justify-center w-screen left-0 overflow-hidden bg-white opacity-30">
        <Image
          src={bgImg}
          alt="Backgound Image"
          className="inset-0 object-fill w-full h-full opacity-75"
        />
        </div>
        <div className="relative flex items-center justify-center w-screen left-0 overflow-hidden ">
          <div className="h-3/4 flex flex-col items-center justify-around">
            <div className="text-center">
              <h1 className="text-theme-color text-3xl md:text-5xl lg:text-7xl font-bold tracking-tight md:tracking-tighter leading-tight my-8 flex items-center">Build smarter with Modular</h1>
              <br/>
              <h2 className="m-4 text-2xl lg:text-3xl leading-tight">Faster, Better, and Cost Effective</h2>
            </div>
            <h2 className= "h-28 text-center text-xl lg:text-2xl leading-tight " id="pitch"></h2>
            <div className="CTA click">
            <a href="/book-visit">
              <CTAButton text="Book a Free Site Visit" />
            </a>
            <a href="tel:+918885563262">
              <CTAButton text="Call us" />
            </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* <div className="w-screen flex flex-col justify-center items-center">
        <div className="my-auto flex flex-col gap-3 p-5 md:p-10 lg:p-20 rounded-3xl">
          <h2 className="text-theme-color text-3xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20 mt-8 flex items-center">
          Why Modular Furniture is the Future?
          </h2>
          <p>
          The rapid rise of modular furniture is no surprise—it offers innovative solutions to common challenges faced by homeowners, designers, and architects alike:
          </p>
          <br/>
          <ul className=" md:text-xl flex flex-col gap-3">
            <li>
              <span className="text-theme-color font-bold">
                Faster Move-In Times:
              </span>{" "}
              Modular furniture is built up to 30% faster than traditional carpentry, allowing homeowners to move in and start enjoying their space much sooner.
            </li>
            <li>
              <span className="text-theme-color font-bold">
                Superior Finish:
              </span>{" "}
              Factory-made modular furniture boasts smoother finishes, precise cuts, and minimal defects like bubbles or surface imperfections. This ensures a sleek, high-quality finish that enhances the overall look of any home.
            </li>
            <li>
              <span className="text-theme-color font-bold">
                Effortless Execution:
              </span>{" "}
              With modular furniture, the entire process is streamlined. Automated machinery ensures accuracy, reducing issues related to material procurement and installation. This makes the project smoother from start to finish.
            </li>
            <li>
              <span className="text-theme-color font-bold">
              Personalized Design:
              </span>{" "}
              Gone are the days of one-size-fits-all furniture. Modular designs offer extensive customization options, allowing designers to create personalized pieces that align with both their vision and the homeowner's desires.
            </li>
          </ul>
        </div>
      </div> */}
      <ReviewSection />
      <ServiceSection />
      <ProjectSection />
      <ProcessSection />
      <FooterSection />
    </section>
  );
}
