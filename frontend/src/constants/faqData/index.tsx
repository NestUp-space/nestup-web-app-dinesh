// faqData.tsx

import React from 'react';

interface FAQ {
  question: string;
  answer: JSX.Element;
}

export const faqData: FAQ[] = [
  {
    question: "What is your process?",
    answer: (
      <>
        The process consists of 4 stages.{" "}
        <a href="/process" className="text-theme-color underline">
          Know more
        </a>
        .
      </>
    ),
  },
  {
    question: "What is your pricing structure?",
    answer: (
      <>
        From Site measurement to Installation in 14 working days at ₹320 per sqft
        <br />
        Payment 1 - a Token amount of ₹5000 has to be paid for booking a site visit for measurements - You will be provided with a cutlist and Material estimates after this.
        <br />
        Payment 2 - 110₹/sqft to be paid once you send the material to our plant - After this the production at the factory starts.
        <br />
        Payment 3 - 110₹/sqft (Excluding GST) to be paid once your material is processed and material is ready for shipping - post this payment an eway bill is generated from our end and processed material will be released.
        <br />
        Payment 4 - 100₹/sqft to be paid to the third party installation team on the site based on the work progress.
      </>
    ),
  },
  {
    question: "Do you take up projects from homeowners also?",
    answer: (
      <>
        We only work with interior designers/Contractors & Architects.
        <br />
        We are a hardcore modular factory with an expertise in only modular woodwork, an interior design project needs a lot of planning, coordination and expertise on dealing with many teams simultaneously on the site so it's suggested for a homeowner to work with an interior designer rather than working directly with a modular factory like us.
      </>
    ),
  },
  {
    question: "How long will it take for my projects to be completed?",
    answer: (
      <>
        Once your Material reaches our factory we will complete and release the material after processing within 14 working days.
      </>
    ),
  },
  {
    question: "Do you do screw fitting or full modular?",
    answer: (
      <>
        Screw fitting is the strongest fitting there is, with finish limitations while mini fix gives us a great finish but with limited sturdiness.
        <br />
        Hence we recommend a Hybrid fitting where we can use screw fitting where ever possible and use minifix where there are exposed planks giving best of both the worlds.
      </>
    ),
  },
  {
    question: "How do you manage when walls are undulated ?",
    answer: (
      <>
        No walls are straight without undulations on an actual site, we understand this and leave a buffer of 50 mm while planning a box, the gap is covered with dummies with a scope to cover undulations properly at the site.
      </>
    ),
  },
  {
    question: "Are there any hidden charges?",
    answer: (
      <>
        There are no hidden charges that you have to pay as far as making is concerned ( Site measurements, Cutlists/Material Estimates, Production & Installations), However please note that any type of material purchase , Transportation , tax & Packaging is not included in this 320.
      </>
    ),
  },
  {
    question: "How will I know if my material is not misused or exchanged?",
    answer: (
      <>
        We have a strict transparency policy on the material you send , the cutlists will be shared with you making sure that no extra material is quoted & we have an open door policy which allows you to visit the factory during the time of your production so that you can check the production process yourself.
      </>
    ),
  },
  {
    question: "Can you help us with other sections of the project like false ceiling , electrical, glass or manual work?",
    answer: (
      <>
        We only take up modular woodwork where we support from site measurements to installation but we don’t get involved in any other sections of the project.
      </>
    ),
  },
  {
    question: "I only worked with manual carpenters till now and want to shift to modular , what can I expect?",
    answer: (
      <>
        There are two major things to understand before making the shift from manual woodwork to modular
        <br />
        Pricing : There is a significant(20%) increase in the cost for making the shift from manual woodwork to modular - Please choose modular only if the homeowner is willing to bear this amount.
        <br />
        Design : While making manual furniture the scope can be changed and improvised as the project progresses but for a modular design all the designs need to be confirmed to the last minute detail even before the material procurement is started.
      </>
    ),
  },
  {
    question: "Can I visit your factory?",
    answer: (
      <>
        Yes , we are open to new designer visits to the factory from 11 am to 6 pm Monday to Saturday , if your project is ongoing at the factory you can visit any time and any day our gates are open 24*7.
      </>
    ),
  },
  // Add more FAQs as needed
];
