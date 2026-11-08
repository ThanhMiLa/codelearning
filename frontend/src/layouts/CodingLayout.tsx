import { useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard, LogOut, Mail, Menu, Phone, UserRound, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CodeLearningWordmark from '../components/home/CodeLearningWordmark';
import GitHubIcon from '../components/GitHubIcon';
import avatarImg from '../assets/ava.jpg';
import logoImg from '../assets/LOGO_SINGLE.svg';
import './CodingLayout.css';
import './CodingUI.css';

const navigation = [
  { to: '/', key: 'home' },
  { to: '/oj/practice', key: 'practices' },
  { to: '/contests', key: 'contests' },
  { to: '/deposit', key: 'payments' },
] as const;

const CodingLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin/');
  const isWorkspace = /^\/oj\/problems\/[^/]+$|^\/contests\/[^/]+$|^\/admin\//.test(pathname);
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  const closeMobileMenu = () => mobileMenu.current?.removeAttribute('open');
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      closeMobileMenu();
      navigate('/');
    }
  };

  const accountLink = isAuthenticated ? (
    <>
      <Link to="/profile" className="coding-account" onClick={closeMobileMenu}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} className="coding-account-avatar" width={28} height={28} alt="" />
        ) : (
          <UserRound size={20} aria-hidden="true" />
        )}
        <span>{user?.displayName}</span>
      </Link>
      {user?.roles?.some(role => role === 'ADMIN' || role === 'TEACHER') && (
        <Link to="/admin/dashboard" onClick={closeMobileMenu} aria-label={t('navbar.dashboard')} className="coding-icon-button"><LayoutDashboard size={16} /></Link>
      )}
      <button type="button" onClick={handleLogout} aria-label={t('navbar.logout')} title={t('navbar.logout')} className="coding-icon-button"><LogOut size={16} /></button>
    </>
  ) : (
    <>
      <Link to="/login" className="coding-login" onClick={closeMobileMenu}>
        {t('home.navigation.login')}
      </Link>
      <Link to="/register" className="coding-button coding-button-small" onClick={closeMobileMenu}>
        {t('home.navigation.register')}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </>
  );

  return (
    <div className={`coding-shell dark${isWorkspace ? ' coding-shell-workspace' : ''}`} lang="en">
      <a href="#main-content" className="coding-skip-link">{t('home.navigation.skip')}</a>
      {!isAdmin && <header className="coding-header">
        <div className="coding-container coding-header-inner">
          <Link to="/" className="coding-brand" aria-label="CodeLearning home">
            <img src={logoImg} className="coding-brand-logo" width={35} height={30} alt="" aria-hidden="true" />
            <span>CODELEARNING</span>
          </Link>

          <nav className="coding-desktop-nav" aria-label={t('home.navigation.main')}>
            {navigation.map(({ to, key }) => (
              <NavLink key={key} to={to} end={to === '/'} className={(state) => state.isActive || (key === 'practices' && pathname.startsWith('/oj/')) || (key === 'payments' && pathname.startsWith('/payment/')) ? 'coding-nav-active' : ''}>
                {t(`home.navigation.${key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="coding-header-actions" aria-busy={isLoading}>
            {!isLoading && accountLink}
          </div>

          <details
            className="coding-mobile-menu"
            ref={mobileMenu}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                closeMobileMenu();
                mobileMenu.current?.querySelector('summary')?.focus();
              }
            }}
          >
            <summary aria-label={t('home.navigation.menu')}>
              <Menu className="coding-menu-open-icon" size={22} aria-hidden="true" />
              <X className="coding-menu-close-icon" size={22} aria-hidden="true" />
            </summary>
            <div className="coding-mobile-panel">
              <nav aria-label={t('home.navigation.main')}>
                {navigation.map(({ to, key }) => (
                  <NavLink key={key} to={to} end={to === '/'} onClick={closeMobileMenu}>
                    <span>{t(`home.navigation.${key}`)}</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </NavLink>
                ))}
              </nav>
              <div className="coding-mobile-account">{!isLoading && accountLink}</div>
            </div>
          </details>
        </div>
      </header>}

      <main id="main-content" tabIndex={-1} className={isHome ? undefined : 'coding-screen'}><Outlet /></main>

      {!isWorkspace && <CodeLearningWordmark />}

      {!isWorkspace && (
      <footer className="coding-footer">
        <div className="coding-container">
          <div className="coding-footer-main">
            <div className="coding-footer-developer">
              <img src={avatarImg} alt="Võ Ngọc Thanh" width={64} height={64} loading="lazy" decoding="async" />
              <div>
                <h2>Võ Ngọc Thanh</h2>
                <a href="https://github.com/ThanhMiLa" target="_blank" rel="noopener noreferrer" className="coding-footer-handle">@ThanhMiLa</a>
                <p>{t('home.footer.developer_role')}</p>
              </div>
            </div>
            <div className="coding-footer-contact">
              <h2>{t('home.footer.contact')}</h2>
              <ul>
                <li><a href="mailto:vntvlogs@gmail.com"><Mail size={14} aria-hidden="true" />vntvlogs@gmail.com</a></li>
                <li><a href="tel:0763769325"><Phone size={14} aria-hidden="true" />0763 769 325</a></li>
                <li><a href="https://github.com/ThanhMiLa" target="_blank" rel="noopener noreferrer"><GitHubIcon size={14} aria-hidden="true" />github.com/ThanhMiLa</a></li>
              </ul>
            </div>
            <div className="coding-footer-project">
              <h2>{t('home.footer.project')}</h2>
              <a href="https://github.com/ThanhMiLa/codelearning-platform" target="_blank" rel="noopener noreferrer" className="coding-footer-repository">
                <GitHubIcon size={17} aria-hidden="true" />
                <span>codelearning-platform</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <p>{t('home.footer.repository_description')}</p>
            </div>
          </div>
        </div>
        <div className="coding-container">
          <div className="coding-footer-bottom">
            <span>© {new Date().getFullYear()} CodeLearning</span>
            <span className="coding-footer-signoff"><span aria-hidden="true">&lt;/&gt;</span> {t('home.footer.signoff')}</span>
            <span>{t('home.footer.language')}</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

export default CodingLayout;
