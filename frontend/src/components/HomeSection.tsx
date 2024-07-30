"use client";

import React, { useEffect } from "react";
import { CTAButton } from "./CTAButton";

export function HomeSection() {
  useEffect(() => {
    function printLetterByLetter(
      destination: string,
      message: string,
      speed: number,
      callback: () => void
    ) {
      let i = 0;
      const destinationElement = document.getElementById(destination);

      const interval = setInterval(() => {
        if (destinationElement) {
          // Append one character at a time
          if (message.charAt(i) === "\n") {
            destinationElement.innerHTML += "<br>";
          } else {
            destinationElement.innerHTML += message.charAt(i);
          }
          i++;
          if (i >= message.length) {
            clearInterval(interval);
            if (callback && typeof callback === "function") {
              callback();
            }
          }
        }
      }, speed);
    }

    const message = "Faster,\nBetter,\nand\nCost\nEffective";

    printLetterByLetter("pitch", message, 100, () => {
      const ctaElements = document.getElementsByClassName("CTA");
      for (let j = 0; j < ctaElements.length; j++) {
        const element = ctaElements[j] as HTMLElement; // Cast to HTMLElement
        setTimeout(() => {
          element.style.visibility = "visible";
        }, j * 300);
      }
    });


  }, []);

  return (
    <section className="h-180vh md:h-90vh" id="home">
      <div className="flex flex-col md:flex-row">
        <div className="h-dvh w-screen md:w-50% left-0 flex-col justify-center overflow-hidden bg-theme-color">
          <h1 id="pitch"></h1>
          <div className="promise">
            <h1 className="CTA">
              From <span className="promise-highlight">Site measurement</span>
            </h1>
            <h1 className="CTA">
              to <span className="promise-highlight">Installation</span>
            </h1>
            <h1 className="CTA">
              in <span className="promise-highlight">14</span> working days
            </h1>
            <h1 className="CTA">
              at <span className="promise-highlight">₹320</span> per sqft
            </h1>
          </div>
          <div className="CTA click">
            <a href="#contactus">
              <CTAButton text="Schedule a Visit" />
            </a>
            <a href="tel:+918885563262">
              <CTAButton text="Call us" />
            </a>
          </div>
        </div>
        <div className="h-dvh w-screen md:w-50% flex flex-col justify-center items-center px-10">
          <div className="my-auto">
            <h2 className="text-theme-color font-bold text-3xl">
              Building smarter with Modular
            </h2>
            <h3>Why modular construction is the future for India</h3>
            <p>
              The fast rise of modular construction is no surprise. It solves
              key problems for homeowners, designers, architects, and all of us:
            </p>
            <br />
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
