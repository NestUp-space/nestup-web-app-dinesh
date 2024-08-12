"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

import Logo from "@img/NestupLogoText.svg";
import userIcon from "@img/user.svg";
import menu from "@img/menu.svg";

import instaLogo from "@img/icons8-instagram.svg";

import NavLink from "./Navlink";

const links = [
  { url: "/", title: "Home" },
  { url: "/experience", title: "Experience" },
  { url: "/contact", title: "Contact" },
];

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
    <div className="h-full w-screen flex items-center justify-between px-4 sm:px-8 md:px-12 lg:px-20 xl:px-48">
      
      {/* Large Screen Menu */}
      <div className="hidden md:flex gap-3 w-1/3 justify-start">
        {links.map((link) => (
          <NavLink link={link} key={link.title} />
        ))}
      </div>
      {/* LOGO */}

      <div className=" lg:flex md:w-1/3 justify-center">
        <Link href="/" className="flex rounded-md h-12 ">
          <Image
            src={Logo}
            alt="logo"
            className="relative w-auto max-h-full object-contain hover:cursor-pointer"
          />
        </Link>
      </div>
      
      {/* Social Links */}
      <div className="hidden md:flex gap-4 w-1/3 justify-end items-center">
        <Link href="https://www.instagram.com/nestup.space/" target="_blank">
          <Image src={instaLogo} alt="instagram logo" height={40} width={40} />
        </Link>
        <div className="flex items-center gap-x-5 h-full">
        <div className="flex items-center gap-x-2 h-full">
          <span className="font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer pr-[30px]">
            Book a Site Visit
          </span>
          <span className="hidden lg:block font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer">
            Sign in
          </span>
        </div>
      </div>
      </div>
      

      {/* Small and Medium Screen Menu */}
      <div className="md:hidden z-40">
        <button
          className="w-10 h-8 flex flex-col justify-between z-50 relative"
          onClick={() => setMenuOpen(!MenuOpen)}
        >
          <motion.div
            variants={topVariants}
            animate={MenuOpen ? "opened" : "closed"}
            className="w-10 h-1 bg-black rounded origin-left"
          ></motion.div>
          <motion.div
            variants={centerVariants}
            animate={MenuOpen ? "opened" : "closed"}
            className="w-10 h-1 bg-black rounded "
          ></motion.div>
          <motion.div
            variants={bottomVariants}
            animate={MenuOpen ? "opened" : "closed"}
            className="w-10 h-1 bg-black rounded origin-left"
          ></motion.div>
        </button>
        {MenuOpen && (
          <div>
            <motion.div
              variants={listVariants}
              initial="closed"
              animate="opened"
              className="absolute top-0 left-0 w-screen h-screen bg-black text-white flex flex-col items-center justify-center gap-8 text-4xl "
            >
              {links.map((link) => (
                <motion.div variants={listItemVariants} key={link.title}>
                  <Link className="" href={link.url}>
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
