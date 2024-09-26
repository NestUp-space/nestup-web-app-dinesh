'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

export function DashboardBreadcrumb() {
  const path = usePathname();
  const pathArray = path ? path.split('/').filter((p) => p) : [];

  const breadcrumbItems = pathArray.map((segment, index) => {
    const breadcrumbPath = `/${pathArray.slice(0, index + 1).join('/')}`;
    const formattedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);

    return (
      <BreadcrumbItem key={breadcrumbPath}>
        {index !== pathArray.length - 1 ? (
          <>
            <BreadcrumbLink asChild>
              <Link href={breadcrumbPath}>
                {formattedSegment.replace(/([A-Z])/g, ' $1')}
              </Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </>
        ) : (
          <BreadcrumbPage>{formattedSegment.replace(/([A-Z])/g, ' $1')}</BreadcrumbPage>
        )}
      </BreadcrumbItem>
    );
  });

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
    </Breadcrumb>
  );
}
