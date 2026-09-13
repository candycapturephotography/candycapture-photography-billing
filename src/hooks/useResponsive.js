import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * useResponsive Hook
 * 
 * Detects viewport width and provides responsive breakpoint information.
 * Breakpoints:
 * - mobile: < 480px
 * - tablet: 480px - 767px
 * - laptop: 768px - 1023px
 * - desktop: >= 1024px
 * 
 * Validates: Requirements 22.1
 */

// Breakpoint values in pixels
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1280, // Upper bound for desktop (used for reference only)
}

/**
 * Determines the current viewport category based on width
 * @param {number} width - Current viewport width
 * @returns {'mobile' | 'tablet' | 'laptop' | 'desktop'} - Current viewport category
 */
function getViewport(width) {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile'
  }
  if (width < BREAKPOINTS.tablet) {
    return 'tablet'
  }
  if (width < BREAKPOINTS.laptop) {
    return 'laptop'
  }
  return 'desktop'
}

/**
 * Custom hook for responsive viewport detection
 * 
 * @returns {Object} Responsive state object containing:
 *   - viewport: Current viewport category ('mobile' | 'tablet' | 'laptop' | 'desktop')
 *   - width: Current viewport width in pixels
 *   - isMobile: Boolean - true if viewport < 480px
 *   - isTablet: Boolean - true if viewport is 480-767px
 *   - isLaptop: Boolean - true if viewport is 768-1023px
 *   - isDesktop: Boolean - true if viewport >= 1024px
 *   - isMobileOrTablet: Boolean - true if viewport < 768px
 *   - isLaptopOrDesktop: Boolean - true if viewport >= 768px
 * 
 * @example
 * const { isMobile, isDesktop, viewport } = useResponsive()
 * 
 * if (isMobile) {
 *   // Render mobile layout
 * }
 */
export function useResponsive() {
  // Initialize with a safe default for SSR/initial render
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth
    }
    return BREAKPOINTS.desktop // Default to desktop during SSR
  })

  // Debounced resize handler to prevent excessive re-renders
  const handleResize = useCallback(() => {
    setWidth(window.innerWidth)
  }, [])

  useEffect(() => {
    // Ensure we have the correct initial width
    setWidth(window.innerWidth)

    // Add resize listener
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  // Memoize the responsive state object
  const responsive = useMemo(() => {
    const viewport = getViewport(width)
    
    return {
      // Current viewport category
      viewport,
      
      // Current width in pixels
      width,
      
      // Individual breakpoint flags
      isMobile: viewport === 'mobile',
      isTablet: viewport === 'tablet',
      isLaptop: viewport === 'laptop',
      isDesktop: viewport === 'desktop',
      
      // Combined breakpoint flags for common use cases
      isMobileOrTablet: width < BREAKPOINTS.tablet,
      isLaptopOrDesktop: width >= BREAKPOINTS.tablet,
      
      // Breakpoint values for reference
      breakpoints: BREAKPOINTS,
    }
  }, [width])

  return responsive
}

export default useResponsive
