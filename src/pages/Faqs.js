import React, { useCallback, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164
} from '../utils/businessContact';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import InternalLinksBlock from '../components/InternalLinksBlock';
import { getLegalInternalLinks } from '../data/seoInternalLinks';
import { buildStaticPageSchemas, flattenFaqCategories } from '../utils/jsonLd';
import { getCanonicalUrl } from '../utils/seo';
import { FAQ_CATEGORIES, FAQ_META } from '../data/faqContent';
import '../pages/PrivacyPolicy.css';
import './Faqs.css';

function FaqItem({ question, answer, isOpen, onToggle, panelId, buttonId }) {
  return (
    <div className={`faq-item${isOpen ? ' faq-item--open' : ''}`}>
      <h3 className="faq-item__heading">
        <button
          type="button"
          id={buttonId}
          className="faq-item__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span>{question}</span>
          <ChevronDown size={20} aria-hidden className="faq-item__chevron" />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="faq-item__panel"
        hidden={!isOpen}
      >
        <p className="faq-item__answer">{answer}</p>
      </div>
    </div>
  );
}

export default function Faqs() {
  const baseId = useId();
  const [openKey, setOpenKey] = useState(null);

  const pageTitle = buildPageTitle('FAQs', businessDisplayName);
  const description = buildMetaDescription(
    'Bazaar FAQs',
    `Find answers about orders, delivery, payments, returns, and shopping on ${businessDisplayName}.`,
    `${businessDisplayName} help centre.`
  );

  const toggle = useCallback((key) => {
    setOpenKey((current) => (current === key ? null : key));
  }, []);

  const faqSchema = useMemo(
    () =>
      buildStaticPageSchemas({
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/faqs' }
        ],
        faqs: flattenFaqCategories(FAQ_CATEGORIES),
        speakableUrl: getCanonicalUrl('/faqs'),
        speakableSelectors: ['#faq-title', '.legal-page__meta']
      }),
    []
  );

  return (
    <>
      <SEO title={pageTitle} description={description} schema={faqSchema} />

      <header className="page-header page-header--product-detail">
        <div className="container">
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              FAQs
            </li>
          </ol>
        </div>
      </header>

      <article className="legal-page faq-page">
        <section className="legal-page__hero" aria-labelledby="faq-title">
          <div className="container legal-page__hero-inner">
            <div className="legal-page__hero-icon" aria-hidden>
              <HelpCircle size={28} strokeWidth={1.75} />
            </div>
            <div>
              <p className="legal-page__eyebrow">{businessDisplayName}</p>
              <h1 id="faq-title" className="legal-page__title">
                {FAQ_META.title}
              </h1>
              <p className="legal-page__meta">{FAQ_META.subtitle}</p>
            </div>
          </div>
        </section>

        <div className="container legal-page__layout">
          <nav className="legal-page__toc faq-page__toc" aria-label="FAQ categories">
            <p className="legal-page__toc-title">Categories</p>
            <ol className="legal-page__toc-list">
              {FAQ_CATEGORIES.map((category) => (
                <li key={category.id}>
                  <a href={`#faq-${category.id}`}>{category.title}</a>
                </li>
              ))}
            </ol>
            <aside className="faq-page__help-card">
              <p className="faq-page__help-title">Still need help?</p>
              <p className="faq-page__help-text">Our team is available to assist with orders and delivery.</p>
              <a href={`tel:${businessPhoneE164}`} className="faq-page__help-phone">
                <Phone size={18} aria-hidden />
                {businessPhoneDisplay}
              </a>
              <Link to="/contact-us" className="faq-page__help-link">
                Contact Us →
              </Link>
            </aside>
          </nav>

          <div className="legal-page__content">
            {FAQ_CATEGORIES.map((category) => (
              <section
                key={category.id}
                id={`faq-${category.id}`}
                className="legal-page__section faq-page__category"
                aria-labelledby={`faq-${category.id}-heading`}
              >
                <h2 id={`faq-${category.id}-heading`} className="legal-page__section-title">
                  {category.title}
                </h2>
                <div className="faq-page__list">
                  {category.items.map((item, index) => {
                    const key = `${category.id}-${index}`;
                    return (
                      <FaqItem
                        key={key}
                        question={item.q}
                        answer={item.a}
                        isOpen={openKey === key}
                        onToggle={() => toggle(key)}
                        buttonId={`${baseId}-${key}-btn`}
                        panelId={`${baseId}-${key}-panel`}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <InternalLinksBlock
            className="legal-page__internal-links"
            title="Helpful pages"
            links={getLegalInternalLinks('/faqs')}
          />
        </div>
      </article>
    </>
  );
}
