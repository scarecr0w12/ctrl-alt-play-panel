import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  className?: string;
  disabled?: boolean;
}

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsOpen(true);
    }
  };

  const handleClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('contextmenu', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onContextMenu={handleContextMenu}
    >
      {children}
      
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[200px] bg-white border border-gray-200 rounded-md shadow-lg py-1"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.separator ? (
                <div className="border-t border-gray-100 my-1" />
              ) : (
                <button
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => handleClick(item)}
                  disabled={item.disabled}
                >
                  {item.icon && (
                    <span className="w-4 h-4">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Hook for programmatic context menu
export const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const openContextMenu = (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  const closeContextMenu = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    position,
    openContextMenu,
    closeContextMenu,
  };
};