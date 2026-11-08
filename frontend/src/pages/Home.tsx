import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, CornerDownRight, Terminal, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import HomeCodePreview from '../components/home/HomeCodePreview';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="coding-home">
      <section className="home-hero coding-container" aria-labelledby="home-title">
        <h1 id="home-title">
          <span className="home-title-line">{t('home.hero.title_first')}</span>{' '}
          <span className="home-title-line">{t('home.hero.title_second')}<span className="home-cursor" aria-hidden="true">_</span></span>
        </h1>
        <p className="home-hero-description">{t('home.hero.description')}</p>
        <div className="home-hero-actions">
          <Link to="/oj/practice" className="coding-button">
            <Terminal size={16} aria-hidden="true" />
            {t('home.hero.practice')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/contests" className="coding-button coding-button-secondary">
            {t('home.hero.contests')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="home-hero-note"><span aria-hidden="true">//</span> {t('home.hero.note')}</p>
        <div className="home-preview-heading">
          <span><span aria-hidden="true">┌─</span> {t('home.preview.heading')}</span>
          <span>{t('home.preview.read_only')}</span>
        </div>
        <HomeCodePreview />
        <div className="home-preview-caption">
          <span>{t('home.preview.caption')}</span>
          <a href="#explore" className="coding-text-link">{t('home.preview.explore')} <ArrowDown aria-hidden="true" /></a>
        </div>
      </section>

      <section id="explore" className="home-explore coding-container" aria-labelledby="home-explore-title">
        <div className="home-section-heading">
          <h2 id="home-explore-title">{t('home.explore.title')}</h2>
          <p>{t('home.explore.description')}</p>
        </div>
        <div className="home-pathways">
          <article className="home-pathway">
            <div className="home-pathway-command"><Terminal size={18} aria-hidden="true" /><span>practice<span className="home-command-flag"> --at-your-pace</span></span></div>
            <h3>{t('home.explore.practice_title')}</h3>
            <p>{t('home.explore.practice_description')}</p>
            <ul>
              <li><CornerDownRight size={14} aria-hidden="true" />{t('home.explore.practice_feature_one')}</li>
              <li><CornerDownRight size={14} aria-hidden="true" />{t('home.explore.practice_feature_two')}</li>
              <li><CornerDownRight size={14} aria-hidden="true" />{t('home.explore.practice_feature_three')}</li>
            </ul>
            <Link to="/oj/practice" className="coding-text-link">{t('home.explore.practice_link')} <ArrowUpRight aria-hidden="true" /></Link>
          </article>
          <article className="home-pathway">
            <div className="home-pathway-command"><Trophy size={18} aria-hidden="true" /><span>contest<span className="home-command-flag"> --challenge-yourself</span></span></div>
            <h3>{t('home.explore.contest_title')}</h3>
            <p>{t('home.explore.contest_description')}</p>
            <ul>
              <li><CornerDownRight size={14} aria-hidden="true" />{t('home.explore.contest_feature_one')}</li>
              <li><CornerDownRight size={14} aria-hidden="true" />{t('home.explore.contest_feature_two')}</li>
              <li><CornerDownRight size={14} aria-hidden="true" />{t('home.explore.contest_feature_three')}</li>
            </ul>
            <Link to="/contests" className="coding-text-link">{t('home.explore.contest_link')} <ArrowUpRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className="home-start coding-container" aria-labelledby="home-start-title">
        <div className="home-start-prompt" aria-hidden="true"><span>❯</span><span className="home-start-cursor" /></div>
        <div className="home-start-copy">
          <h2 id="home-start-title">{t('home.start.title')}</h2>
          <p>{t(isAuthenticated ? 'home.start.authenticated_description' : 'home.start.description')}</p>
        </div>
        <Link to={isAuthenticated ? '/oj/practice' : '/register'} className="coding-button">
          {t(isAuthenticated ? 'home.hero.practice' : 'home.start.register')}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
};

export default Home;
