"use client"


import { useRef } from "react";
import FAQ from "@components/landing-page/Faq";
import { Footer } from "@/components/landing-page/Footer";
import Navbar from "@/components/landing-page/Navbar";
import { DetailedProcess } from "@/components/landing-page/detailedProcess";

const Process = () => {

  const containerRef = useRef();

  return ( 
    <div className="">
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <div className="mt-24 w-screen" >
        {/* text*/}
        <div className=" gap-0 flex flex-col md:gap-0 lg:gap-8 lg:pr-0 xl:gap-16 w-screen lg:w-2/3 xl:1/2">
          {/* Bio*/}
          <DetailedProcess/>
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
