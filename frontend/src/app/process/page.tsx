"use client"


import { useRef } from "react";


const Process = () => {

  const containerRef = useRef();

  return ( 
    <div className="h-full">
      <div className=" h-full overflow-scroll lg:flex" >
        {/* text*/}
        <div className="p-20 xl:p-48 gap-0 flex flex-col md:gap-0 lg:gap-8 lg:pr-0 xl:gap-16 w-full lg:w-2/3 xl:1/2">
          {/* Bio*/}
          <div className="flex flex-col gap-5 justify-center">
            <h1 className="text-2xl font-bold">Process</h1>
          </div>
  
        </div>
        
      </div>
    </div>
  );
};

export default Process