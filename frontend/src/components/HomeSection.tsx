"use client";

import React, { useEffect, useRef } from "react";
import { CTAButton } from "./CTAButton";

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
        }, j * 500);
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
    <section className="h-90vh" id="home">
      <div className="flex flex-col">
        <div className="flex items-center justify-center h-dvh w-screen md:w-50% left-0 overflow-hidden bg-lightest-bg">
          <div className="h-3/4 flex flex-col items-center justify-around">
            <div className="text-center">
              <h1 className="text-6xl text-theme-color text-bold">Build smarter with Modular</h1>
              <br/>
              <h2>Faster, Better, and Cost Effective</h2>
            </div>
            <h2 className= "text-center" id="pitch"></h2>
            <div className="CTA click">
              <a href="#contactus">
                <CTAButton text="Book a Site Visit" />
              </a>
              <a href="tel:+918885563262">
                <CTAButton text="Call us" />
              </a>
            </div>
          </div>
        </div>
        <div className="h-dvh w-screen md:w-50% flex flex-col justify-center items-center px-10">
          <div className="my-auto">
            <h2 className="text-theme-color font-bold text-3xl">
              Building smarter with Modular
            </h2>
            <h3>Why modular construction is the future?</h3>
            <p>
              The fast rise of modular construction is no surprise. It solves
              key problems for homeowners, designers, architects, and all of us:
            </p>
            <br/>
            <ul>
              <li>
                <span className="text-theme-color font-bold">
                  Get in Faster:
                </span>{" "}
                Modular homes get built up to 30% quicker, meaning you can move
                in and enjoy your new place sooner.
              </li>
              <li>
                <span className="text-theme-color font-bold">
                  Save on Costs:
                </span>{" "}
                Prefabricated units and less manpower on-site lead to big
                savings compared to the usual way we build things.
              </li>
              <li>
                <span className="text-theme-color font-bold">
                  Eco-Friendly Building:
                </span>{" "}
                Modular construction uses materials responsibly and minimises
                waste, making it kinder on the environment.
              </li>
              <li>
                <span className="text-theme-color font-bold">
                  Design Your Way:
                </span>{" "}
                Don't be stuck with a boring box! Modular designs can be
                customised in all sorts of ways, so homeowners can create homes
                that suit their vision and what people are looking for.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
