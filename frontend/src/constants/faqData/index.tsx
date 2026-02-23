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
        Our process consists of 12 stages.{" "}
        <a href="/process" className="text-theme-color underline">
          Learn more
        </a>
        .
      </>
    ),
  },
  {
    question: "What is your pricing structure?",
    answer: (
      <>
        <strong>Payment 1:</strong> A token amount of ₹5,000 is required to book a site visit for measurements. After this, you’ll receive a cutlist and material estimates.
        <br />
        <strong>Payment 2:</strong> ₹110/sqft to be paid once materials are sent to our plant. Production begins after this.
        <br />
        <strong>Payment 3:</strong> ₹110/sqft (excluding GST) is to be paid once your material is processed and ready for dispatch. We will generate the e-way bill and release the material post payment.
        <br />
        <strong>Payment 4:</strong> ₹100/sqft to be paid directly to the third-party installation team based on work progress at the site.
      </>
    ),
  },
  {
    question: "Do you take on projects from homeowners directly?",
    answer: (
      <>
        We work exclusively with Interior Designers, Contractors, and Architects.
        <br />
        As a specialized modular woodwork factory, we focus solely on modular execution. Interior design projects require coordination across multiple teams, which is best handled by an experienced Interior Designer. Hence, we recommend homeowners work through a professional rather than directly with us.
      </>
    ),
  },
  {
    question: "How long will it take for my project to be completed?",
    answer: (
      <>
        Once your materials reach our factory, we will process and dispatch them within 14 working days.
      </>
    ),
  },
  {
    question: "Do you use screw fittings or full modular fittings?",
    answer: (
      <>
        Screw fittings offer unmatched strength but can have finish limitations, while VB fittings provide a sleek finish but are less sturdy.
        <br />
        We recommend a hybrid approach — using screw fittings wherever possible for strength, and VB fittings for exposed areas to maintain a clean finish. This gives you the best of both worlds.
      </>
    ),
  },
  {
    question: "How do you handle undulated (uneven) walls?",
    answer: (
      <>
        Walls are rarely perfectly straight on-site. We account for this by leaving a 50mm buffer while planning each box. This gap is covered with fillers, allowing for adjustments to accommodate wall undulations during installation.
      </>
    ),
  },
  {
    question: "Are there any hidden charges?",
    answer: (
      <>
        No, there are no hidden charges for our core services — site measurement, cutlists/material estimates, production, and installation.
        <br />
        However, please note that material procurement, transportation, taxes, and packaging are not included in the ₹220/sqft pricing.
      </>
    ),
  },
  {
    question: "How can I be sure my materials won’t be misused or exchanged?",
    answer: (
      <>
        We follow a strict transparency policy. All cutlists are shared with you to ensure no excess material is quoted. We also follow an open-door policy — you’re welcome to visit the factory during production to personally verify the process.
      </>
    ),
  },
  {
    question: "Can you handle other parts of the project like false ceilings, electricals, glass, or manual work?",
    answer: (
      <>
        No. We only undertake modular woodwork — from site measurements to final installation. We do not handle other trades such as electrical, false ceiling, or manual carpentry work.
      </>
    ),
  },
  {
    question: "I’ve only worked with manual carpenters till now. What should I know before switching to modular?",
    answer: (
      <>
        Here are two key differences to consider:
        <br />
        <strong>1. Cost:</strong> Switching from manual to modular typically increases the cost by about 20%. Ensure the homeowner is prepared for this investment.
        <br />
        <strong>2. Design:</strong> Unlike manual carpentry, where changes can be made on the fly, modular work requires all designs to be finalized — down to the last detail — before material procurement begins.
      </>
    ),
  },
  {
    question: "Can I visit your factory?",
    answer: (
      <>
        Absolutely! We welcome designer visits Monday to Saturday, between 10 AM and 6 PM. If your project is under production, you can drop in any time — our factory is operational 24×7.
      </>
    ),
  },
];
