import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sun, Moon } from 'lucide-react';
import logoImg from '../assets/LOGO_SINGLE.svg';

const LearningLayout: React.FC = () => {
  const navigate = useNavigate();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('theme-change'));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Minimalistic Header */}
      <header className="h-14 border-b border-slate-300 dark:border-slate-800/60 bg-white dark:bg-slate-900 sticky top-0 z-30 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center space-x-1.5 font-bold tracking-wider text-indigo-600 dark:text-indigo-400 text-sm">
            <img src={logoImg} className="h-8 w-auto rounded object-contain invert dark:invert-0" alt="CodeLearning Logo" />
            <span className="hidden sm:inline">CodeLearning</span>
          </Link>
        </div>

        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <span>Learning Workspace</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          <Link
            to="/oj/practice"
            className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/20 transition-all active:scale-95"
          >
            Leave Class
          </Link>
        </div>
      </header>

      {/* Main Workspace content */}
      <div className="flex-grow flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default LearningLayout;
