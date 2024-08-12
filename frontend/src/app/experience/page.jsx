"use client"

import { motion, useScroll } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";


const AboutPage = () => {

  const containerRef = useRef();
  const { scrollYProgress } = useScroll({ container: containerRef });

  return ( 
    <motion.div className="h-full" 
    initial={{y: "-200vh" }} 
    animate={{y: "0%" }} 
    transition={{duration: 0.9}}
    >
      <div className=" h-full overflow-scroll lg:flex" ref={containerRef}>
        {/* text*/}
        <div className="p-20 xl:p-48 gap-0 flex flex-col md:gap-0 lg:gap-8 lg:pr-0 xl:gap-16 w-full lg:w-2/3 xl:1/2">
          {/* Bio*/}
          <div className="flex flex-col gap-5 justify-center">
            <h1 className="text-2xl font-bold">Profile Summary</h1>
            <p>
              I am a Product Manager with a passion for human-centric design and expertise in both product and program management. My experience spans B2B SaaS, education, and automotive industries, where I excel in transforming innovative ideas into scalable, impactful solutions. As a Senior Product Manager at BYJU&#39;s, I led the development of OrderKart, streamlining order processing for thousands of students. I leverage data-driven insights and agile methodologies to deliver exceptional, customer-centric products. With strong technical and analytical skills, I am committed to driving business growth and fostering lasting client value.
            </p>
            <hr class="h-px mx-0 my-8 bg-gray-200 border-0 dark:bg-gray-700"></hr>
          </div>
  
        </div>
        
      </div>

    </motion.div>
  );
};

export default AboutPage