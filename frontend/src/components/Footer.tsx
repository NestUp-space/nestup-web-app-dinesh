"use client";
import Link from "next/link";
import Image from "next/image";

import Logo from "@img/NestupLogoText.svg";

import instaLogo from "@img/icons8-instagram.svg";

import NavLink from "./Navlink";

const links = [
  { url: "/", title: "Home" },
  { url: "/process", title: "How it works" },
  { url: "/portfolio", title: "Our Works" },
  { url: "/blog", title: "Our blog" },
  { url: "/contactus", title: "Contact Us" },
];

export function Footer() {
  return (
    <div className="h-auto bg-theme-dark bottom-0 p-1">
      <div className="flex flex-row rounded-3xl bg-white m-10">
        <div className="w-1/2 p-5 flex flex-col items-center gap-3">
          <p className="text-sm text-theme-dark">TIRED OF MISTAKES?</p>
          <p className="text-3xl text-theme-color">Let&#39;s build your dream project!</p>
          <Link href="/contact" className="flex justify-center rounded-md h-10 min-w-32 bg-theme-color text-white ">
            <button>Book a Site Visit</button>
          </Link>
        </div>
        <div className="w-1/2 p-5 flex flex-col items-center gap-3">
          <p className="text-sm text-theme-dark">GETTING CURIOUS?</p>
          <p className="text-3xl text-theme-color">See how it works!</p>
          <p>Take a look how we make it happen</p>
          <Link href="/process" className="flex justify-center rounded-md h-10 min-w-32 bg-theme-color text-white">
            <button>Show me</button>
          </Link>
        </div>
      </div>
      <div className="p-10 flex">
        <div>
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
          
          <div className= "my-5 text-white">
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
            <p>© 2024 Nestup.space All rights reserved.</p>
          </div>
        </div>
        <div className="h-full w-screen flex items-center justify-evenly px-4 sm:px-8 md:px-12 lg:px-20 xl:px-48">
          
          {/* Large Screen Menu */}
          <div className="flex flex-col gap-3 w-1/3 justify-start text-white ">
            {links.map((link) => (
              <NavLink link={link} key={link.title} />
            ))}
          </div>
        
          {/* Social Links */}
          <div className="flex flex-col gap-3 w-1/3 justify-start text-white">
            <Link href="/" >
              <span className="font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer ">
                Book a Site Visit
              </span>
            </Link>
            <Link href="/" >
              <span className=" block font-medium text-bw-dark hover:text-theme-color hover:cursor-pointer">
                Sign in
              </span>
            </Link>
            
          </div>
        </div>
      </div>
      
    </div>
  );
};

