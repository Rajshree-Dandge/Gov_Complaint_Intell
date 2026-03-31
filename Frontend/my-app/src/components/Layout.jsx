import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { TutorialOverlay } from './TutorialOverlay.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useEffect } from 'react';
import { Toaster } from './ui2/sonner';

export function Layout() {
  const location = useLocation();
  const { showTutorial, setShowTutorial } = useApp();

  useEffect(() => {
    // UPDATED: Check for /dashboard since that is where the main view sits
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      if (!tutorialCompleted) {
        const timer = setTimeout(() => setShowTutorial(true), 800);
        return () => clearTimeout(timer);
      }
    } else {
      setShowTutorial(false);
    }
  }, [location.pathname, setShowTutorial]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet /> 
      </main>
      
      {/* Tutorial only shows on the main dashboard path */}
      {showTutorial && (location.pathname === '/dashboard' || location.pathname === '/dashboard/') && (
        <TutorialOverlay />
      )}
      
      <Toaster richColors position="top-right" />
    </div>
  );
}