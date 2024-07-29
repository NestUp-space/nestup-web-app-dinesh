import React from "react";
import { CTAButton } from "./CTAButton";

export function HomeSection() {
  return (
    <section className="index-section" id="home">
      <div className="flex flex-col md:flex-row">
        <div className="home-left">
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
        <div className="home-right">
          <div className="right-text">
            <h2 className="bold-text">Building smarter with Modular</h2>
            <h3>Why modular construction is the future for India</h3>
            <p>
              The fast rise of modular construction is no surprise. It solves key problems for homeowners, designers, architects, and all of us:
            </p>
            <ul>
              <li>
                <span className="bold-text">Get in Faster:</span> Modular homes get built up to 30% quicker, meaning you can move in and enjoy your new place sooner.
              </li>
              <li>
                <span className="bold-text">Save on Costs:</span> Prefabricated units and less manpower on-site lead to big savings compared to the usual way we build things.
              </li>
              <li>
                <span className="bold-text">Eco-Friendly Building:</span> Modular construction uses materials responsibly and minimises waste, making it kinder on the environment.
              </li>
              <li>
                <span className="bold-text">Design Your Way:</span> Don't be stuck with a boring box! Modular designs can be customised in all sorts of ways, so homeowners can create homes that suit their vision and what people are looking for.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
