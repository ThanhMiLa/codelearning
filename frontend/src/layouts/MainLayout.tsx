import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
  Trophy,
  Code,
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  Mail,
  Phone,
  ExternalLink,
  Heart,
  BookOpen,
  Settings,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import avatarImg from '../assets/ava.jpg';
import logoImg from '../assets/LOGO_SINGLE.svg';

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isWorkspaceRoute =
    location.pathname.includes('/oj/problems/') ||
    location.pathname.includes('/contests/') ||
    location.pathname.includes('dashboard') ||
    location.pathname.includes('/admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isGuestSettingsOpen, setIsGuestSettingsOpen] = useState(false);



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

  const handleLogout = async () => {
    await logout();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const showDashboardLink = user?.roles?.includes('ADMIN') || user?.roles?.includes('TEACHER');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full glass shadow-sm transition-all duration-200">
        <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                <img src={logoImg} className="h-[41px] w-auto rounded-lg object-contain invert dark:invert-0" alt="CodeLearning Logo" />
                <span>CodeLearning</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {showDashboardLink && (
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center space-x-1 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                    location.pathname.startsWith('/admin') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t('navbar.dashboard')}</span>
                </Link>
              )}
              <Link
                to="/courses"
                className={`flex items-center space-x-1 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                  location.pathname.startsWith('/courses') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>{t('navbar.courses')}</span>
              </Link>
              <Link
                to="/oj/practice"
                className={`flex items-center space-x-1 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                  location.pathname.startsWith('/oj') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Code className="h-4 w-4" />
                <span>{t('navbar.practice')}</span>
              </Link>
              <Link
                to="/contests"
                className={`flex items-center space-x-1 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                  location.pathname.startsWith('/contests') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>{t('navbar.contests')}</span>
              </Link>
              {isAuthenticated && (
                <Link
                  to="/my-learning"
                  className={`flex items-center space-x-1 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                    location.pathname.startsWith('/my-learning') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{t('navbar.myLearning')}</span>
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Donate / Support Button */}
                  <button
                    onClick={() => navigate('/deposit')}
                    className="flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 text-sm font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm group"
                    title={t('navbar.support')}
                  >
                    <Heart className="h-5.5 w-5.5 text-rose-500 fill-rose-500 animate-pulse group-hover:scale-110 transition-transform" />
                    <span>{t('navbar.donate')}</span>
                  </button>

                  {/* User Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 text-sm font-medium focus:outline-none py-1.5 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                    >
                      <img
                        src={user?.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                        alt={user?.displayName}
                        className="h-7 w-7 rounded-full object-cover shadow-sm border border-indigo-100 dark:border-indigo-950"
                      />
                      <span className="max-w-[120px] truncate">{user?.displayName}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-300 dark:border-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                        {showDashboardLink && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                            <span>{t('navbar.dashboard')}</span>
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors"
                        >
                          <UserIcon className="h-4 w-4 text-indigo-500" />
                          <span>{t('navbar.profile')}</span>
                        </Link>

                        <hr className="my-1 border-slate-200 dark:border-slate-800" />

                        {/* Theme Toggle option */}
                        <button
                          onClick={toggleTheme}
                          className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center space-x-2">
                            {theme === 'light' ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-indigo-500" />}
                            <span>{t('navbar.theme')}</span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                            {theme}
                          </span>
                        </button>

                        <hr className="my-1 border-slate-200 dark:border-slate-800" />

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('navbar.logout')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Settings Icon Dropdown for guest */}
                  <div className="relative">
                    <button
                      onClick={() => setIsGuestSettingsOpen(!isGuestSettingsOpen)}
                      className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    {isGuestSettingsOpen && (
                      <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-300 dark:border-slate-800 p-2.5 z-50 flex flex-col space-y-2">
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <span>{t('navbar.theme')}</span>
                          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
                    {t('navbar.login')}
                  </Link>
                  <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95">
                    {t('navbar.register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden space-x-3">
              <button onClick={toggleTheme} className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              {/* Cart is hidden */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 space-y-3 shadow-inner">
            {showDashboardLink && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium">{t('navbar.dashboard')}</span>
              </Link>
            )}
            <Link
              to="/courses"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">{t('navbar.courses')}</span>
            </Link>
            <Link
              to="/oj/practice"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Code className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">{t('navbar.practice')}</span>
            </Link>
            <Link
              to="/contests"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Trophy className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">{t('navbar.contests')}</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/my-learning"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium">{t('navbar.myLearning')}</span>
              </Link>
            )}

            {isAuthenticated && user ? (
              <>
                <div className="h-[1px] bg-slate-100 dark:border-slate-800 my-1"></div>
                 <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/deposit');
                  }}
                  className="px-3 py-2.5 flex items-center justify-between bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/10 cursor-pointer transition-colors mb-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center"><Heart className="h-5.5 w-5.5 mr-2 text-rose-500 fill-rose-500 animate-pulse" />{t('navbar.donate')}</span>
                  <span className="font-extrabold flex items-center space-x-1.5 text-sm">
                    <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-black">{t('navbar.support')}</span>
                  </span>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <UserIcon className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm font-medium">{t('navbar.profile')}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 py-2 px-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('navbar.logout')}</span>
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col space-y-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t('navbar.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {t('navbar.register')}
                </Link>
              </div>
            )}
          </div>
        )}


      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      {!isWorkspaceRoute && (
        <footer className="relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
          {/* Decorative gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 relative">
            {/* Main Footer Content */}
            <div className="py-12 lg:py-16">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">

              {/* Developer Profile Column */}
              <div className="md:col-span-5 lg:col-span-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={avatarImg}
                    alt="Võ Ngọc Thanh"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg shadow-indigo-500/5 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Võ Ngọc Thanh
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                      @ThanhMiLa
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs">
                      {t('footer.developer_desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Column */}
              <div className="md:col-span-3 lg:col-span-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                  {t('footer.contact')}
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="mailto:vntvlogs@gmail.com"
                      className="flex items-center space-x-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                    >
                      <Mail className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                      <span className="font-medium">vntvlogs@gmail.com</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:0763769325"
                      className="flex items-center space-x-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                    >
                      <Phone className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                      <span className="font-medium">0763 769 325</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/ThanhMiLa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                    >
                      <GithubIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                      <span className="font-medium">github.com/ThanhMiLa</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Quick Links & Project Column */}
              <div className="md:col-span-4 lg:col-span-5">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                  {t('footer.project')}
                </h4>
                <div className="space-y-3">
                  <a
                    href="https://github.com/ThanhMiLa/codelearning-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center shrink-0">
                        <GithubIcon className="h-4.5 w-4.5 text-white dark:text-slate-900" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white block leading-tight">codelearning-platform</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{t('footer.open_source')}</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </a>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link to="/oj/practice" className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all">{t('navbar.practice')}</Link>
                    <Link to="/contests" className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all">{t('navbar.contests')}</Link>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-200/80 dark:border-slate-800/80 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <img src={logoImg} className="h-[29px] w-auto rounded object-contain invert dark:invert-0" alt="CodeLearning Logo" />
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">CodeLearning</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center space-x-1">
              <span>© {new Date().getFullYear()} Võ Ngọc Thanh. {t('footer.made_with')}</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500 inline" />
              <span>{t('footer.for_developers')}</span>
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

export default MainLayout;
