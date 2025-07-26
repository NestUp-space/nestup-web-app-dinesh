"use client";
import Link from "next/link";
import Image from "next/legacy/image";

import Logo from "@img/NestupLogoText.svg";
import CallToActionSection from "./CallToActionSection";
import instaLogo from "@img/icons8-instagram.svg";
import NavLink from "./Navlink";
import {links} from "@constants/navLinks"; 

export function Footer() {
  return (
    <div className="h-auto bg-white bottom-0 p-1">
      <CallToActionSection/>
      <div className="p-10">
        {/* LOGO */}
        <div className=" w-24 justify-center bg-white px-2">
          <Link href="/" className="flex rounded-md h-12 ">
            <Image
              src={Logo}
              alt="logo"
              className="relative max-h-full object-contain hover:cursor-pointer"
            />
          </Link>
          </div>
        <div className=" flex flex-col md:flex-row">
          <div>
            
            <div className= "my-5 text-theme-dark">
              <p>WANT TO TALK TO US?</p>
              <p className="text-3xl my-3">team@nestup.space</p>
              <a href="https://g.co/kgs/zBdf4wa">NestUp Space Modular Factory</a>
              <p>
                BHEL Ancillary Industrial Estate, Bharat Heavy Electricals Limited, Hyderabad, Telangana 502032
              </p>
              <p>
                Contact us - 8885563262
              </p>
              <div className="flex gap-2 m-2">
                <div className="bg-white p-1">
                  <Link href="https://www.instagram.com/nestup.space/" target="_blank">
                    <Image src={instaLogo} alt="instagram logo" height={30} width={30} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className=" text-theme-dark h-full w-screen flex items-center justify-start gap-10 lg:px-20 xl:px-48">
            {/* Large Screen Menu */}
            <div className="flex flex-col gap-3 w-1/3 justify-start ">
              {links.map((link) => (
                <NavLink link={link} key={link.title} />
              ))}
            </div>
          
            {/* Social Links */}
          </div>
        </div>
        <p className="text-theme-dark pb-5">© 2024 Nestup.space All rights reserved.</p>
        <div className="flex flex-col gap-3 w-1/3 justify-start">
            <Link href="/privacypolicy" >
                <span className="text-bw-dark hover:text-theme-color hover:cursor-pointer ">
                  Privacy Policy
                </span>
            </Link>
            </div>
      </div>
      
    </div>
  );
};

