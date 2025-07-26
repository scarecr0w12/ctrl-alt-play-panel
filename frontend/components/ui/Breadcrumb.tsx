import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  maxItems?: number;
  showHome?: boolean;
  homeHref?: string;
  onHomeClick?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRightIcon className="w-4 h-4 text-gray-400" />,
  className,
  maxItems = 5,
  showHome = true,
  homeHref = '/',
  onHomeClick,
}) => {
  const processedItems = [...items];
  
  // Add home item if requested
  if (showHome && processedItems.length > 0) {
    processedItems.unshift({
      label: 'Home',
      href: homeHref,
      onClick: onHomeClick,
      icon: <HomeIcon className="w-4 h-4" />,
    });
  }

  // Handle max items with ellipsis
  let displayItems = processedItems;
  if (processedItems.length > maxItems) {
    displayItems = [
      processedItems[0],
      { label: '...', onClick: () => {} },
      ...processedItems.slice(-maxItems + 2),
    ];
  }

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href && typeof window !== 'undefined') {
      window.location.href = item.href;
    }
  };

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="flex-shrink-0">
              {separator}
            </span>
          )}
          
          <div className="flex items-center">
            {item.label === '...' ? (
              <span className="px-2 py-1 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => handleItemClick(item, index)}
                className={cn(
                  'flex items-center space-x-1 px-2 py-1 rounded-md transition-colors',
                  index === displayItems.length - 1
                    ? 'text-gray-900 font-medium cursor-default'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                )}
                disabled={index === displayItems.length - 1}
              >
                {item.icon && (
                  <span className="flex-shrink-0">{item.icon}</span>
                )}
                <span className="truncate max-w-[150px]">{item.label}</span>
              </button>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Simple breadcrumb component for basic use cases
export interface SimpleBreadcrumbProps {
  path: string;
  separator?: string;
  className?: string;
  onNavigate?: (path: string) => void;
}

export const SimpleBreadcrumb: React.FC<SimpleBreadcrumbProps> = ({
  path,
  separator = '/',
  className,
  onNavigate,
}) => {
  const segments = path.split(separator).filter(Boolean);
  
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const segmentPath = separator + segments.slice(0, index + 1).join(separator);
    return {
      label: segment,
      onClick: () => onNavigate?.(segmentPath),
    };
  });

  return <Breadcrumb items={items} className={className} />;
};