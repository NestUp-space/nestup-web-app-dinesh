"use client"


import { useRef } from "react";
import { ProcessSection } from "@/components/ProcessSection";


const Process = () => {

  const containerRef = useRef();

  return ( 
    <div className="">
      <div className="" >
        {/* text*/}
        <div className=" gap-0 flex flex-col md:gap-0 lg:gap-8 lg:pr-0 xl:gap-16 w-screen lg:w-2/3 xl:1/2">
          {/* Bio*/}
          <h1 className="text-2xl font-bold">Process</h1>
          <ProcessSection/>
        </div>
        
      </div>
    </div>
  );
};

export default Process