/**
 * Performance Optimization Utilities
 * Implementation of Issue #21 - Performance Optimization
 * 
 * Competitive analysis implementation:
 * - Bundle optimization inspired by modern panel systems
 * - Real-time updates without page refreshes (Pterodactyl-style)
 * - Efficient resource monitoring (TCAdmin2-style graphs)
 * - Responsive design with optimized loading (Pelican Panel-style)
 */

import React, { lazy, memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { debounce, throttle } from 'lodash';

// Bundle Optimization - Code Splitting
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyServerManagement = lazy(() => import('../pages/ServerManagement'));
export const LazyFileManager = lazy(() => import('../pages/FileManager'));
export const LazyPluginManager = lazy(() => import('../pages/PluginManager'));
export const LazyPerformanceMonitor = lazy(() => import('../pages/PerformanceMonitor'));
export const LazyMarketplace = lazy(() => import('../pages/Marketplace'));

// Performance-optimized components with memoization
export const OptimizedCard = memo(({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className || ''}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Performance-optimized list component
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 60,
  containerHeight = 400 
}: {
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
}) => {
  const visibleItems = useMemo(() => {
    const startIndex = 0;
    const endIndex = Math.min(Math.ceil(containerHeight / itemHeight), items.length);
    return items.slice(startIndex, endIndex);
  }, [items, itemHeight, containerHeight]);

  return (
    <div 
      className="overflow-auto" 
      style={{ height: containerHeight }}
    >
      {visibleItems.map((item, index) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Real-time data hook with optimizations
export const useRealTimeData = (
  endpoint: string, 
  interval: number = 30000,
  enabled: boolean = true
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    
    const intervalId = setInterval(fetchData, interval);
    
    return () => clearInterval(intervalId);
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
};

// Debounced search hook
export const useDebouncedSearch = (
  searchTerm: string, 
  delay: number = 300
) => {
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedValue;
};

// Performance monitoring hook
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            
            setMetrics(prev => ({
              ...prev,
              page_load_time: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
              dom_content_loaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
              first_contentful_paint: 0, // Would be set by paint observer
              largest_contentful_paint: 0, // Would be set by LCP observer
              cumulative_layout_shift: 0, // Would be set by layout-shift observer
              first_input_delay: 0 // Would be set by first-input observer
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

      return () => observer.disconnect();
    }
  }, []);

  return metrics;
};

// Throttled scroll handler
export const useThrottledScroll = (
  callback: (event: Event) => void,
  delay: number = 100
) => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    window.addEventListener('scroll', throttledCallback);
    
    return () => {
      window.removeEventListener('scroll', throttledCallback);
      throttledCallback.cancel();
    };
  }, [throttledCallback]);
};

// Image lazy loading component
export const LazyImage = memo(({ 
  src, 
  alt, 
  className, 
  placeholder = '/images/placeholder.svg' 
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-50'} ${className || ''}`}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
    />
  );
});

LazyImage.displayName = 'LazyImage';

// Cache management utility
class CacheManager {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 300000);

// Bundle analyzer configuration (webpack.config.js enhancement)
export const bundleAnalyzerConfig = {
  // Code splitting configuration
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5
      },
      dashboard: {
        test: /[\\/]src[\\/]pages[\\/]Dashboard/,
        name: 'dashboard',
        chunks: 'all',
        priority: 8
      },
      fileManager: {
        test: /[\\/]src[\\/]pages[\\/]FileManager/,
        name: 'file-manager',
        chunks: 'all',
        priority: 8
      }
    }
  },
  
  // Minimize configuration
  minimizer: [
    'terser-webpack-plugin',
    'css-minimizer-webpack-plugin'
  ],
  
  // Module concatenation
  concatenateModules: true,
  
  // Tree shaking configuration
  usedExports: true,
  sideEffects: false
};

// Performance monitoring utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string, renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
  },

  // Track user interactions
  trackInteraction: (action: string, element: string) => {
    // This would integrate with analytics
    console.log(`User interaction: ${action} on ${element}`);
  },

  // Measure API response times
  measureApiCall: async (url: string, options?: RequestInit) => {
    const start = performance.now();
    
    try {
      const response = await fetch(url, options);
      const end = performance.now();
      
      console.log(`API call to ${url}: ${(end - start).toFixed(2)}ms`);
      return response;
    } catch (error) {
      const end = performance.now();
      console.log(`API call to ${url} failed after ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  },

  // Get Core Web Vitals
  getCoreWebVitals: () => {
    return new Promise((resolve) => {
      const vitals: Record<string, number> = {};

      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const firstInputEntry = entry as PerformanceEventTiming;
          vitals.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      setTimeout(() => resolve(vitals), 1000);
    });
  }
};

// Types for performance monitoring
interface PerformanceMetrics {
  page_load_time: number;
  dom_content_loaded: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  cumulative_layout_shift: number;
  first_input_delay: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Export all optimization utilities
export default {
  LazyDashboard,
  LazyServerManagement,
  LazyFileManager,
  LazyPluginManager,
  LazyPerformanceMonitor,
  LazyMarketplace,
  OptimizedCard,
  VirtualizedList,
  useRealTimeData,
  useDebouncedSearch,
  usePerformanceMetrics,
  useThrottledScroll,
  LazyImage,
  cacheManager,
  bundleAnalyzerConfig,
  performanceUtils
};
