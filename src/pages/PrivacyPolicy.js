import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164,
  formatBusinessAddressLine
} from '../utils/businessContact';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import InternalLinksBlock from '../components/InternalLinksBlock';
import { getLegalInternalLinks } from '../data/seoInternalLinks';
import { buildStaticPageSchemas } from '../utils/jsonLd';
import { PRIVACY_POLICY_META, PRIVACY_POLICY_SECTIONS } from '../data/privacyPolicyContent';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const pageTitle = buildPageTitle('Privacy Policy', businessDisplayName);
  const description = buildMetaDescription(
    'Privacy Policy',
    `Read how ${businessDisplayName} collects, uses, and protects your personal information when you shop online.`,
    `${businessDisplayName} privacy and data protection.`
  );

  const pageSchema = useMemo(
    () =>
      buildStaticPageSchemas({
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy-policy' }
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
              Privacy Policy
            </li>
          </ol>
        </div>
      </header>

      <article className="legal-page">
        <section className="legal-page__hero" aria-labelledby="privacy-title">
          <div className="container legal-page__hero-inner">
            <div className="legal-page__hero-icon" aria-hidden>
              <Shield size={28} strokeWidth={1.75} />
            </div>
            <div>
              <p className="legal-page__eyebrow">{businessDisplayName}</p>
              <h1 id="privacy-title" className="legal-page__title">
                {PRIVACY_POLICY_META.title}
              </h1>
              <p className="legal-page__meta">
                Last updated: {PRIVACY_POLICY_META.lastUpdated} · Applies to {PRIVACY_POLICY_META.effectiveSite}
              </p>
            </div>
          </div>
        </section>

        <div className="container legal-page__layout">
          <nav className="legal-page__toc" aria-label="Privacy policy sections">
            <p className="legal-page__toc-title">On this page</p>
            <ol className="legal-page__toc-list">
              {PRIVACY_POLICY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-page__content">
            {PRIVACY_POLICY_SECTIONS.map((section) => (
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

            <aside className="legal-page__contact" aria-label="Privacy contact">
              <h2 className="legal-page__contact-title">Need help with your data?</h2>
              <p className="legal-page__paragraph">
                Contact {businessDisplayName} for privacy-related questions or account requests.
              </p>
              <p className="legal-page__contact-line">
                <Phone size={18} aria-hidden />
                <a href={`tel:${businessPhoneE164}`}>{businessPhoneDisplay}</a>
              </p>
              <p className="legal-page__contact-line">
                <MapPin size={18} aria-hidden />
                <span>{formatBusinessAddressLine()}</span>
              </p>
              <InternalLinksBlock
                className="legal-page__internal-links"
                title="Related policies & help"
                links={getLegalInternalLinks('/privacy-policy')}
              />
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
