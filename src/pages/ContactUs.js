import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Headphones, MapPin, Phone, MessageCircle, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164,
  formatBusinessAddressLine,
  businessAddressRegion
} from '../utils/businessContact';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import {
  CONTACT_FEEDBACK,
  CONTACT_HERO,
  CONTACT_HOURS,
  CONTACT_INTRO,
  CONTACT_REACH
} from '../data/contactUsContent';
import './ContactUs.css';
import InternalLinksBlock from '../components/InternalLinksBlock';
import { getLegalInternalLinks } from '../data/seoInternalLinks';
import { buildStaticPageSchemas } from '../utils/jsonLd';
import { getCanonicalUrl } from '../utils/seo';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const pageTitle = buildPageTitle('Contact Us', businessDisplayName);
  const description = buildMetaDescription(
    'Contact Bazaar',
    `Reach ${businessDisplayName} for orders, delivery help, and feedback. Phone support and FAQs available.`,
    `${businessDisplayName} customer service.`
  );

  const pageSchema = useMemo(
    () =>
      buildStaticPageSchemas({
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'Contact Us', path: '/contact-us' }
        ],
        speakableUrl: getCanonicalUrl('/contact-us'),
        speakableSelectors: ['#contact-title', '.contact-page__subtitle']
      }),
    []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    toast.success('Thanks — we received your message and will get back to you soon.');
    setForm({ name: '', email: '', message: '' });
  };

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
              Contact Us
            </li>
          </ol>
        </div>
      </header>

      <article className="contact-page">
        <section className="contact-page__hero" aria-labelledby="contact-title">
          <div className="container contact-page__hero-inner">
            <span className="contact-page__hero-icon" aria-hidden>
              <Headphones size={28} strokeWidth={1.75} />
            </span>
            <div>
              <h1 id="contact-title" className="contact-page__title">
                {CONTACT_HERO.title}
              </h1>
              <p className="contact-page__subtitle">{CONTACT_HERO.subtitle}</p>
            </div>
          </div>
        </section>

        <div className="container contact-page__layout">
          <div className="contact-page__main">
            {CONTACT_INTRO.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="contact-page__text">
                {paragraph}
              </p>
            ))}

            <section className="contact-page__block" aria-labelledby="contact-reach-title">
              <h2 id="contact-reach-title" className="contact-page__section-title">
                {CONTACT_REACH.title}
              </h2>
              {CONTACT_REACH.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="contact-page__text">
                  {paragraph}
                </p>
              ))}

              <div className="contact-page__phone-card">
                <p className="contact-page__phone-label">{CONTACT_REACH.phoneLabel}</p>
                <a href={`tel:${businessPhoneE164}`} className="contact-page__phone">
                  <Phone size={22} aria-hidden />
                  {CONTACT_REACH.phoneDisplay}
                </a>
              </div>

              <p className="contact-page__text">
                For quick answers to common questions, you can also check our{' '}
                <Link to="/faqs" className="contact-page__inline-link">
                  FAQs page
                </Link>
                .
              </p>
            </section>

            <section className="contact-page__block" aria-labelledby="contact-feedback-title">
              <h2 id="contact-feedback-title" className="contact-page__section-title">
                {CONTACT_FEEDBACK.title}
              </h2>
              {CONTACT_FEEDBACK.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="contact-page__text">
                  {paragraph}
                </p>
              ))}
            </section>
          </div>

          <aside className="contact-page__aside">
            <div className="contact-page__info-card">
              <h3 className="contact-page__info-title">{businessDisplayName}</h3>
              <p className="contact-page__info-line">
                <Clock size={18} aria-hidden />
                <span>{CONTACT_HOURS}</span>
              </p>
              <p className="contact-page__info-line">
                <MapPin size={18} aria-hidden />
                <span>
                  {formatBusinessAddressLine()}, {businessAddressRegion}
                </span>
              </p>
              <p className="contact-page__info-line">
                <Phone size={18} aria-hidden />
                <a href={`tel:${businessPhoneE164}`}>{businessPhoneDisplay}</a>
              </p>
              <Link to="/shop" className="btn btn-gold contact-page__shop-btn">
                Continue Shopping
              </Link>
            </div>

            <form className="contact-page__form" onSubmit={handleSubmit} noValidate>
              <h3 className="contact-page__form-title">
                <MessageCircle size={20} aria-hidden />
                Send us a message
              </h3>
              <label className="contact-page__label" htmlFor="contact-name">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                className="contact-page__input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoComplete="name"
              />
              <label className="contact-page__label" htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                className="contact-page__input"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
              <label className="contact-page__label" htmlFor="contact-message">
                Message
              </label>
              <textarea
                id="contact-message"
                className="contact-page__textarea"
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
              <button type="submit" className="btn btn-gold contact-page__submit">
                Submit
              </button>
            </form>
          </aside>
        </div>

        <InternalLinksBlock
          className="legal-page__internal-links"
          title="Customer help & policies"
          links={getLegalInternalLinks('/contact-us')}
        />
      </article>
    </>
  );
}
