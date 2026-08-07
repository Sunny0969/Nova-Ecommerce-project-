import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import SEO from './SEO';
import InternalLinksBlock from './InternalLinksBlock';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164,
  formatBusinessAddressLine,
  businessAddressRegion
} from '../utils/businessContact';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import { buildStaticPageSchemas } from '../utils/jsonLd';
import { getLegalInternalLinks } from '../data/seoInternalLinks';
import '../pages/PrivacyPolicy.css';

export default function LegalPolicyLayout({
  path,
  breadcrumbLabel,
  meta,
  sections,
  icon: Icon,
  seoTopic,
  seoLead,
  seoFallback,
  contactTitle = 'Questions about this policy?',
  contactIntro
}) {
  const pageTitle = buildPageTitle(breadcrumbLabel, businessDisplayName);
  const description = buildMetaDescription(seoTopic, seoLead, seoFallback);

  const pageSchema = useMemo(
    () =>
      buildStaticPageSchemas({
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: breadcrumbLabel, path }
        ]
      }),
    [breadcrumbLabel, path]
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
              {breadcrumbLabel}
            </li>
          </ol>
        </div>
      </header>

      <article className="legal-page">
        <section className="legal-page__hero" aria-labelledby={`${meta.pageId}-title`}>
          <div className="container legal-page__hero-inner">
            {Icon ? (
              <div className="legal-page__hero-icon" aria-hidden>
                <Icon size={28} strokeWidth={1.75} />
              </div>
            ) : null}
            <div>
              <p className="legal-page__eyebrow">{businessDisplayName}</p>
              <h1 id={`${meta.pageId}-title`} className="legal-page__title">
                {meta.title}
              </h1>
              <p className="legal-page__meta">
                Last updated: {meta.lastUpdated} · Applies to {meta.effectiveSite}
              </p>
            </div>
          </div>
        </section>

        <div className="container legal-page__layout">
          <nav className="legal-page__toc" aria-label={`${breadcrumbLabel} sections`}>
            <p className="legal-page__toc-title">On this page</p>
            <ol className="legal-page__toc-list">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-page__content">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-page__section"
                aria-labelledby={`${section.id}-heading`}
              >
                <h2 id={`${section.id}-heading`} className="legal-page__section-title">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
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

            <aside className="legal-page__contact" aria-label="Policy contact">
              <h2 className="legal-page__contact-title">{contactTitle}</h2>
              <p className="legal-page__paragraph">
                {contactIntro ||
                  `Contact ${businessDisplayName} for help with orders, delivery, or policy questions.`}
              </p>
              <p className="legal-page__contact-line">
                <Phone size={18} aria-hidden />
                <a href={`tel:${businessPhoneE164}`}>{businessPhoneDisplay}</a>
              </p>
              <p className="legal-page__contact-line">
                <MapPin size={18} aria-hidden />
                <span>
                  {formatBusinessAddressLine()}, {businessAddressRegion}, Pakistan
                </span>
              </p>
              <p className="legal-page__contact-line">
                <Link to="/contact-us" className="legal-page__link">
                  Contact Us
                </Link>
              </p>
              <InternalLinksBlock
                className="legal-page__internal-links"
                title="Related policies & help"
                links={getLegalInternalLinks(path)}
              />
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
