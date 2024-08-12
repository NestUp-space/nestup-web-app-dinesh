import React from "react";
import Image from "next/image";
import Link from "next/link"

import Logo from "../../public/img/NestupLogoText.png";
import userIcon from "../../public/img/user.svg";
import menu from "../../public/img/menu.svg"; 

import { useState } from "react"
import { motion } from "framer-motion"

const navLinks = [
  { url: "/", title: "Home"},
  { url: "/experience", title: "Experience"},
  { url: "/contact", title: "Contact"},
];

export function Navbar() {
  
  return (
    <nav className="flex w-full items-center justify-between px-2 py-1 h-[7vh] bg-gray-800">
      <div className="flex items-center h-full">
        <Image src={Logo} alt="Logo" className="relative w-auto max-h-full object-contain hover:cursor-pointer" />
        <div className="hidden lg:flex pl-[74px] gap-x-[56px]">
          {navLinks.map((item, index) => (
            <p className="hidden lg:block font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer"key = {index}>{item.title}</p>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-x-5 h-full">
        <div className="flex items-center gap-x-2 h-full">
          <span className="font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer pr-[30px]">Book a Site Visit</span>
          <div className="relative h-full min-w-8">
            <Image src={userIcon} alt="User Profile" layout="fill" objectFit="contain" />
          </div>
          <span className="hidden lg:block font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer">Sign in</span>
        </div>
        <div className="relative h-full min-w-8">
          <Image src={menu} alt="Menu" layout="fill" objectFit="contain" />
        </div>
      </div>
    </nav>
  );
}
