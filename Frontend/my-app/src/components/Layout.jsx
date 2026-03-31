import { Outlet, useLocation } from 'react-router';
import { Navbar } from './Navbar.jsx';
import { TutorialOverlay } from './TutorialOverlay.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useEffect } from 'react';
import { Toaster } from './ui2/sonner';

export function Layout() {
  const location = useLocation();
  const { showTutorial, setShowTutorial } = useApp();

  useEffect(() => {
    // Only show tutorial on dashboard page
    if (location.pathname === '/') {
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      if (!tutorialCompleted) {
        // Small delay to ensure elements are rendered
        setTimeout(() => setShowTutorial(true), 500);
      }
    } else {
      setShowTutorial(false);
    }
  }, [location.pathname, setShowTutorial]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
      {showTutorial && location.pathname === '/' && <TutorialOverlay />}
      <Toaster richColors position="top-right" />
    </div>
  );
}