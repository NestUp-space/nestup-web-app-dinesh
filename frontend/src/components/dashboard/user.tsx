"use client";

import { Button } from '@/components/dashboard/button';
import Image from 'next/image';
import Logo from "@img/NestupLogoOnly.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/dashboard/dropdown-menu';
import Link from 'next/link';
import { useUser } from "@/context/UserContext"; // Import the context

export function User() {
  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Image 
          src={Logo} 
          width={36}
          height={36}
          alt="Avatar"
          className="overflow-hidden rounded-full"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className='bg-slate-100'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem>
            <form>
              <button type="submit">Sign Out</button>
            </form>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <Link href="/login">Sign In</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
