import { Moon, Sun, Settings, LogOut } from 'lucide-react';
import { Button } from './ui2/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui2/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useApp } from '../context/AppContext.jsx';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

export function Navbar() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    // In a real app, this would clear session/token
    alert('Logout functionality would be implemented here');
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Welcome & Username */}
          <div className="flex flex-col">
            <span className="text-sm opacity-90">Welcome back,</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{user.name}</span>
              <span className="text-xs opacity-75 italic">({user.role})</span>
            </div>
          </div>

          {/* Center Section - App Name */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-xl font-bold tracking-wide">
              Citizen Complaint Management System
            </h1>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-primary-foreground/10 text-primary-foreground"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="hover:bg-primary-foreground/10 text-primary-foreground"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:bg-primary-foreground/10 rounded-full p-1 transition-colors cursor-pointer">
                  <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary-foreground text-primary">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}