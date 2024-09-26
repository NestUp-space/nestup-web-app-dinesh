"use client"


import { useRef } from "react";
import { ProcessSection } from "@components/ProcessSection";
import FAQ from "@components/Faq";
import { Footer } from "@/components/Footer";
const Process = () => {

  const containerRef = useRef();

  return ( 
    <div className="">
      <div className="" >
        {/* text*/}
        <div className=" gap-0 flex flex-col md:gap-0 lg:gap-8 lg:pr-0 xl:gap-16 w-screen lg:w-2/3 xl:1/2">
          {/* Bio*/}
          <ProcessSection/>
          <FAQ/>
        </div>
        
      </div>
      <div>
        <Footer/>
      </div>
    </div>
  );
};

export default Process