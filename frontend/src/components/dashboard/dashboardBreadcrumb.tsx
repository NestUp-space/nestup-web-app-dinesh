'use client'
import React from 'react'; // Import React
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/dashboard/breadcrumb';

interface DashboardBreadcrumbProps {
  nameMap?: Record<string, string>;
}

export function DashboardBreadcrumb({ nameMap }: DashboardBreadcrumbProps) {
  const path = usePathname();
  const pathArray = path ? path.split('/').filter((p) => p) : [];

  // Ensure "Dashboard" is always the first item if not already present by path logic
  // and if the path is deeper than just /dashboard
  const items = [];
  if (pathArray.length === 0 || (pathArray.length > 0 && pathArray[0] !== 'dashboard')) {
    // This case should ideally not happen if all pages are under /dashboard
    // but as a fallback, or if we are at the root of dashboard.
  } else if (pathArray[0] === 'dashboard' && pathArray.length > 1) {
     items.push(
      <BreadcrumbItem key="/dashboard">
        <BreadcrumbLink asChild>
          <Link href="/dashboard">Dashboard</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
    items.push(<BreadcrumbSeparator key="sep-dashboard"/>);
  }


  const breadcrumbItems = pathArray.map((segment, index) => {
    // Skip the 'dashboard' segment as it's handled above or is the root
    if (segment.toLowerCase() === 'dashboard' && index === 0) {
      if (pathArray.length === 1) { // Only "dashboard" in path
        return (
          <BreadcrumbItem key="/dashboard">
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }
      return null; // Will be handled by the prepended "Dashboard" link or skipped if it's not the last item
    }

    const breadcrumbPath = `/${pathArray.slice(0, index + 1).join('/')}`;
    
    let displaySegment = nameMap && nameMap[segment] 
      ? nameMap[segment] 
      : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/([A-Z]+)/g, ' $1').replace(/(-)/g, ' ');

    // Ensure key is unique even if segments are similar, by appending index
    return (
      <React.Fragment key={`${breadcrumbPath}-${index}`}>
        <BreadcrumbItem>
          {index !== pathArray.length - 1 ? (
            <BreadcrumbLink asChild>
              <Link href={breadcrumbPath}>
                {displaySegment}
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{displaySegment}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {index !== pathArray.length - 1 && <BreadcrumbSeparator />}
      </React.Fragment>
    );
  }).filter(Boolean) as React.ReactElement[]; // Cast to ReactElement[] after filtering

  // Prepend "Dashboard" if it wasn't the only item
   if (pathArray.length > 1 && pathArray[0] === 'dashboard') {
    // items is already initialized with Dashboard and separator
   } else if (pathArray.length === 0 && path === '/') {
     // Handle root case if necessary, though dashboard pages are usually under /dashboard
   }


  return (
    <Breadcrumb className="hidden sm:flex">
      <BreadcrumbList>{items.concat(breadcrumbItems)}</BreadcrumbList>
    </Breadcrumb>
  );
}
