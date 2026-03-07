import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  href: string;
  label: string;
}

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  if (!pathname) return null;

  const pathSegments = pathname.split('/').filter((segment) => segment);
  const breadcrumbItems: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    // Capitalize the first letter and replace hyphens with spaces for better readability
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  // Add a "Home" or "Dashboard" link at the beginning if not already present
  if (breadcrumbItems.length === 0 || (breadcrumbItems[0] && breadcrumbItems[0].label.toLowerCase() !== 'dashboard')) {
    breadcrumbItems.unshift({ href: '/dashboard', label: 'Dashboard' });
  }


  return (
    <nav aria-label="breadcrumb" className="mb-4 text-sm text-gray-500">
      <ol className="list-none p-0 inline-flex">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <ChevronRight size={16} className="mx-2" />}
            {index === breadcrumbItems.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-primary hover:underline">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
