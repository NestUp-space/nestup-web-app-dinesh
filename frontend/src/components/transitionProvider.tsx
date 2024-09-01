"use client";

import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";
import { Footer } from "./Footer";

interface TransitionProviderProps {
  children: ReactNode;
}

const TransitionProvider: React.FC<TransitionProviderProps> = ({ children }) => {
  const pathName = usePathname();
  return (
    <AnimatePresence mode="wait">
      <div key={pathName} className="w-screen h-screen bg-gradient-to-b">
        <motion.div
          className="h-screen w-screen fixed bg-theme-dark rounded-b-[100px] z-50"
          animate={{ height: "0vh" }}
          exit={{ height: "140vh" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="fixed m-auto top-0 bottom-0 left-0 right-0 text-white text-8xl cursor-default z-50 w-fit h-fit"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {pathName.substring(1)}
        </motion.div>
        <motion.div
          className="h-screen w-screen fixed bg-theme-dark rounded-t-[100px] bottom-0 z-40"
          initial={{ height: "140vh" }}
          animate={{ height: "0vh", transition: { delay: 0.5 } }}
        />
        <div className="h-24 top-0 fixed bg-white z-50">
          <Navbar />
        </div>
        <div className="mt-24">
          {children}
        </div>
        <div>
          <Footer/>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default TransitionProvider;
