"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

import Logo from "@img/NestupLogoText.svg";

import NavLink from "./Navlink";
import {links} from "@constants/navLinks"; 
import { CTAButton } from "./CTAButton";


const Navbar = () => {
  const [MenuOpen, setMenuOpen] = useState(false);

  const topVariants = {
    closed: {
      rotate: 0,
    },
    opened: {
      rotate: 45,
      backgroundColor: "rgb(255,255,255)",
    },
  };
  const centerVariants = {
    closed: {
      opacity: 1,
    },
    opened: {
      opacity: 0,
    },
  };
  const bottomVariants = {
    closed: {
      rotate: 0,
    },
    opened: {
      rotate: -45,
      backgroundColor: "rgb(255,255,255)",
    },
  };
  const listVariants = {
    closed: {
      x: "100vw",
    },
    opened: {
      x: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };
  const listItemVariants = {
    closed: {
      x: -10,
      opacity: 0,
    },
    opened: {
      x: 0,
      opacity: 1,
    },
  };

  return (
    <div className="h-24 w-screen flex items-center justify-evenly px-4 sm:px-8 md:px-12 lg:px-20 xl:px-48">
  
       {/* LOGO */}
       <div className="flex justify-left w-24">
        <Link href="/" className="flex rounded-md h-12 ">
          <Image
            src={Logo}
            alt="logo"
            className=" object-contain hover:cursor-pointer"
          />
        </Link>
      </div>
      
      {/* Large Screen Menu */}
      <div className="hidden lg:flex gap-3 justify-start">
        {links.map((link) => (
          <NavLink link={link} key={link.title} />
        ))}
      </div>
      
      {/* buttons */}
      <div className=" flex gap-4 justify-end items-center">
        <div className="flex items-cente h-full">
          <a href="#contactus">
            <CTAButton text="Book a Site Visit" />
          </a>
        </div>
      </div>
      
      {/* Small and Medium Screen Menu */}
      <div className="lg:hidden z-40">
        <button
          className="w-8 h-6 flex flex-col justify-between z-50 relative"
          onClick={() => setMenuOpen(!MenuOpen)}
        >
          <motion.div
            variants={topVariants}
            animate={MenuOpen ? "opened" : "closed"}
            className="w-8 h-0.5 bg-black rounded origin-left"
          ></motion.div>
          <motion.div
            variants={centerVariants}
            animate={MenuOpen ? "opened" : "closed"}
            className="w-8 h-0.5 bg-black rounded "
          ></motion.div>
          <motion.div
            variants={bottomVariants}
            animate={MenuOpen ? "opened" : "closed"}
            className="w-8 h-0.5 bg-black rounded origin-left"
          ></motion.div>
        </button>
        {MenuOpen && (
          <div>
            <motion.div
              variants={listVariants}
              initial="closed"
              animate="opened"
              exit="closed"  // Adds smooth transition when menu is closing
              className="absolute top-0 left-0 w-screen h-screen bg-theme-dark text-white flex flex-col items-center justify-center gap-8 text-4xl "
            >
              {links.map((link) => (
                <motion.div variants={listItemVariants} key={link.title}>
                  <Link 
                  className="" 
                  href={link.url}
                  onClick={() => setMenuOpen(false)} 
                  >
                    {link.title}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
