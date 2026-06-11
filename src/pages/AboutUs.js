import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Package,
  Smartphone,
  Truck,
  ShieldCheck,
  Headphones,
  ShoppingBag,
  MapPin,
  Phone
} from 'lucide-react';
import SEO from '../components/SEO';
import bazaarLogo from '../assets/images/bazaar-logo.jpg';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164,
  formatBusinessAddressLine
} from '../utils/businessContact';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import InternalLinksBlock from '../components/InternalLinksBlock';
import { ABOUT_INTERNAL_LINKS } from '../data/seoInternalLinks';
import { buildStaticPageSchemas } from '../utils/jsonLd';
import { getCanonicalUrl } from '../utils/seo';
import {
  ABOUT_CTA_STEPS,
  ABOUT_HERO,
  ABOUT_INTRO,
  ABOUT_MISSION,
  ABOUT_PRODUCTS,
  ABOUT_WHY_CHOOSE
} from '../data/aboutUsContent';
import './AboutUs.css';

const WHY_ICONS = {
  prices: Tag,
  variety: Package,
  experience: Smartphone,
  delivery: Truck,
  quality: ShieldCheck,
  support: Headphones
};

export default function AboutUs() {
  const pageTitle = buildPageTitle('About Us', 'Online Grocery Pakistan');
  const description = buildMetaDescription(
    'About Bazaar',
    'Learn how Bazaar makes online grocery shopping simple with great prices, wide range, and reliable delivery across Pakistan.',
    `${businessDisplayName} — trusted online grocery delivery.`
  );

  const pageSchema = useMemo(
    () =>
      buildStaticPageSchemas({
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'About Us', path: '/about-us' }
        ],
        speakableUrl: getCanonicalUrl('/about-us'),
        speakableSelectors: ['#about-hero-title', '.about-page__hero-subtitle']
      }),
    []
  );

  return (
    <>
      <SEO title={pageTitle} description={description} schema={pageSchema} />

      <header className="page-header page-header--product-detail">
        <div className="container">
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              About Us
            </li>
          </ol>
        </div>
      </header>

      <article className="about-page">
        <section className="about-page__hero" aria-labelledby="about-hero-title">
          <div className="container about-page__hero-inner">
            <div className="about-page__hero-copy">
              <p className="about-page__eyebrow">{ABOUT_HERO.eyebrow}</p>
              <h1 id="about-hero-title" className="about-page__hero-title">
                {ABOUT_HERO.title}
              </h1>
              <p className="about-page__hero-subtitle">{ABOUT_HERO.subtitle}</p>
              <div className="about-page__hero-actions">
                <Link to="/shop" className="btn btn-gold about-page__cta-btn">
                  <ShoppingBag size={18} aria-hidden />
                  Start Shopping
                </Link>
                <Link to="/contact-us" className="btn btn-outline about-page__cta-btn about-page__cta-btn--ghost">
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="about-page__hero-brand" aria-hidden>
              <img src={bazaarLogo} alt="Bazaar online grocery logo" className="about-page__logo" width={320} height={106} />
            </div>
          </div>
        </section>

        <section className="about-page__section about-page__section--intro">
          <div className="container about-page__split">
            <div className="about-page__intro-card">
              <h2 className="about-page__section-title">{ABOUT_INTRO.heading}</h2>
              {ABOUT_INTRO.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="about-page__text">
                  {paragraph.startsWith('Bazaar ')
                    ? paragraph.replace(/^Bazaar/, businessDisplayName)
                    : paragraph}
                </p>
              ))}
            </div>
            <aside className="about-page__contact-card" aria-label="Store contact">
              <h3 className="about-page__contact-title">{businessDisplayName}</h3>
              <p className="about-page__contact-line">
                <MapPin size={18} aria-hidden />
                <span>{formatBusinessAddressLine()}</span>
              </p>
              <p className="about-page__contact-line">
                <Phone size={18} aria-hidden />
                <a href={`tel:${businessPhoneE164}`}>{businessPhoneDisplay}</a>
              </p>
              <Link to="/shop" className="about-page__contact-link">
                Browse all products →
              </Link>
            </aside>
          </div>
        </section>

        <section className="about-page__section about-page__section--mission" aria-labelledby="about-mission-title">
          <div className="container about-page__mission">
            <p className="about-page__eyebrow about-page__eyebrow--dark">About Us</p>
            <h2 id="about-mission-title" className="about-page__section-title about-page__section-title--center">
              {ABOUT_MISSION.title}
            </h2>
            <p className="about-page__mission-text">{ABOUT_MISSION.text}</p>
          </div>
        </section>

        <section className="about-page__section about-page__section--why" aria-labelledby="about-why-title">
          <div className="container">
            <h2 id="about-why-title" className="about-page__section-title">
              Why Customers Choose {businessDisplayName}
            </h2>
            <div className="about-page__why-grid">
              {ABOUT_WHY_CHOOSE.map((item) => {
                const Icon = WHY_ICONS[item.id] || Package;
                return (
                  <article key={item.id} className="about-page__why-card">
                    <span className="about-page__why-icon" aria-hidden>
                      <Icon size={24} strokeWidth={1.75} />
                    </span>
                    <h3 className="about-page__why-title">{item.title}</h3>
                    <p className="about-page__why-text">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="about-page__section about-page__section--products" aria-labelledby="about-products-title">
          <div className="container about-page__products">
            <div className="about-page__products-copy">
              <h2 id="about-products-title" className="about-page__section-title">
                {ABOUT_PRODUCTS.title.replace('App', 'Store')}
              </h2>
              <p className="about-page__text">{ABOUT_PRODUCTS.text}</p>
              <Link to="/#categories" className="btn btn-gold about-page__cta-btn">
                Browse grocery categories online
              </Link>
            </div>
            <div className="about-page__stats" aria-label="Store highlights">
              <div className="about-page__stat">
                <strong>1,000+</strong>
                <span>Products</span>
              </div>
              <div className="about-page__stat">
                <strong>30+</strong>
                <span>Categories</span>
              </div>
              <div className="about-page__stat">
                <strong>24/7</strong>
                <span>Online Shopping</span>
              </div>
            </div>
          </div>
        </section>

        <section className="about-page__section about-page__section--cta" aria-labelledby="about-cta-title">
          <div className="container about-page__cta">
            <div className="about-page__cta-copy">
              <h2 id="about-cta-title" className="about-page__section-title about-page__section-title--light">
                Start Shopping with {businessDisplayName} Today
              </h2>
              <p className="about-page__cta-lead">
                Experience hassle-free online grocery shopping in Pakistan — anytime, anywhere on our website.
              </p>
              <ol className="about-page__steps">
                {ABOUT_CTA_STEPS.map((step, index) => (
                  <li key={step} className="about-page__step">
                    <span className="about-page__step-num" aria-hidden>
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <Link to="/shop" className="btn btn-gold about-page__cta-btn about-page__cta-btn--large">
                Shop groceries online in Pakistan
              </Link>
            </div>
            <div className="about-page__cta-panel" aria-hidden>
              <img src={bazaarLogo} alt="" className="about-page__cta-logo" width={280} height={93} />
              <p className="about-page__cta-tagline">
                Groceries &amp; essentials — delivered with care.
              </p>
            </div>
          </div>
        </section>

        <section className="about-page__section">
          <div className="container">
            <InternalLinksBlock
              className="about-page__internal-links"
              title="Explore Bazaar"
              links={ABOUT_INTERNAL_LINKS}
            />
          </div>
        </section>
      </article>
    </>
  );
}
