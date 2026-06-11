import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164,
  formatBusinessAddressLine
} from '../utils/businessContact';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import { buildStaticPageSchemas } from '../utils/jsonLd';
import { TERMS_META, TERMS_SECTIONS } from '../data/termsConditionsContent';
import './PrivacyPolicy.css';

export default function TermsAndConditions() {
  const pageTitle = buildPageTitle('Terms and Conditions', businessDisplayName);
  const description = buildMetaDescription(
    'Terms and Conditions',
    `Read the terms for shopping on ${businessDisplayName} at bazaar-pk.com — orders, accounts, delivery, and use of our website.`,
    `${businessDisplayName} website terms of use.`
  );

  const pageSchema = useMemo(
    () =>
      buildStaticPageSchemas({
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'Terms and Conditions', path: '/terms-and-conditions' }
        ]
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
              Terms and Conditions
            </li>
          </ol>
        </div>
      </header>

      <article className="legal-page">
        <section className="legal-page__hero" aria-labelledby="terms-title">
          <div className="container legal-page__hero-inner">
            <div className="legal-page__hero-icon" aria-hidden>
              <FileText size={28} strokeWidth={1.75} />
            </div>
            <div>
              <p className="legal-page__eyebrow">{businessDisplayName}</p>
              <h1 id="terms-title" className="legal-page__title">
                {TERMS_META.title}
              </h1>
              <p className="legal-page__meta">
                Last updated: {TERMS_META.lastUpdated} · Applies to {TERMS_META.effectiveSite}
              </p>
            </div>
          </div>
        </section>

        <div className="container legal-page__layout">
          <nav className="legal-page__toc" aria-label="Terms sections">
            <p className="legal-page__toc-title">On this page</p>
            <ol className="legal-page__toc-list">
              {TERMS_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-page__content">
            {TERMS_SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-page__section"
                aria-labelledby={`${section.id}-heading`}
              >
                <h2 id={`${section.id}-heading`} className="legal-page__section-title">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="legal-page__paragraph">
                    {paragraph}
                  </p>
                ))}
                {section.list ? (
                  <ul className="legal-page__list">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {section.tailParagraphs?.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="legal-page__paragraph">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <aside className="legal-page__contact" aria-label="Terms contact">
              <h2 className="legal-page__contact-title">Related policies</h2>
              <p className="legal-page__paragraph">
                These Terms work together with our other policies for {businessDisplayName}.
              </p>
              <p className="legal-page__contact-line">
                <Phone size={18} aria-hidden />
                <a href={`tel:${businessPhoneE164}`}>{businessPhoneDisplay}</a>
              </p>
              <p className="legal-page__contact-line">
                <MapPin size={18} aria-hidden />
                <span>{formatBusinessAddressLine()}</span>
              </p>
              <Link to="/privacy-policy" className="legal-page__link">
                Privacy Policy
              </Link>
              {' · '}
              <Link to="/faqs" className="legal-page__link">
                FAQs
              </Link>
              {' · '}
              <Link to="/contact-us" className="legal-page__link">
                Contact Us
              </Link>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
