import { useEffect } from 'react';
import { useLocation } from 'wouter';

const THEME_COLORS = {
  dashboard: '#FFD5DC', // Pup pink for dashboard
  default: '#FAF7F0'    // Light golden tan background for other pages
};

export function useThemeColor() {
  const [location] = useLocation();

  useEffect(() => {
    const isDashboard = location === '/' || location === '/dashboard';
    const themeColor = isDashboard ? THEME_COLORS.dashboard : THEME_COLORS.default;
    
    // Update the theme-color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor);
    } else {
      // Create the meta tag if it doesn't exist
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      themeColorMeta.setAttribute('content', themeColor);
      document.head.appendChild(themeColorMeta);
    }
  }, [location]);
}