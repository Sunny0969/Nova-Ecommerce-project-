import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategorySeoContent } from '../data/categorySeoContent';
import { getClusterLinksForCategory } from '../data/seoInternalLinks';
import { getPillarGuideSections } from '../data/pillarGuideContent';
import { filterValidFaqs } from '../utils/jsonLd';

function formatRs(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

function buildPriceRows(seo, products) {
  const fromSeo = (seo?.priceList || []).filter((r) => r?.name);
  if (fromSeo.length > 0) return fromSeo.slice(0, 10);

  return (products || [])
    .slice(0, 10)
    .map((p) => ({
      name: p.name || 'Product',
      price: p.price,
      _id: p._id
    }));
}

export default function CategoryShopSeo({ categorySlug, categoryName, products = [] }) {
  const seo = useMemo(() => getCategorySeoContent(categorySlug), [categorySlug]);
  const [openFaq, setOpenFaq] = useState(null);

  const priceRows = useMemo(() => buildPriceRows(seo, products), [seo, products]);
  const faqs = useMemo(() => filterValidFaqs(seo?.faqs), [seo]);
  const clusterLinks = useMemo(() => getClusterLinksForCategory(categorySlug), [categorySlug]);
  const pillarSections = useMemo(() => getPillarGuideSections(categorySlug), [categorySlug]);

  if (!seo && priceRows.length === 0 && !pillarSections.length) return null;

  const title = seo?.introTitle || `Shop ${categoryName || 'Products'} Online`;
  const introParas =
    seo?.introParagraphs?.length > 0
      ? seo.introParagraphs
      : [
          `Browse our ${(categoryName || 'products').toLowerCase()} range with everyday low prices and convenient delivery.`
        ];

  const whyBullets =
    seo?.whyBullets?.length > 0
      ? seo.whyBullets
      : [
          {
            label: 'Certified & Original Products',
            text: 'Genuine products from trusted brands.'
          },
          {
            label: 'Daily Low Pricing',
            text: 'Affordable prices and great value packs.'
          },
          {
            label: 'Convenient Delivery',
            text: 'Reliable delivery to your doorstep.'
          }
        ];

  const whyTitle = seo?.whyTitle || `Why Shop with Rozana for ${categoryName || 'this category'}?`;

  const hasBottom = faqs.length > 0 || priceRows.length > 0;

  return (
    <section className="category-shop-seo" aria-labelledby="category-seo-heading">
      <div className="category-shop-seo__intro">
        <h2 id="category-seo-heading" className="category-shop-seo__title">
          {title}
        </h2>
        {introParas.map((para, i) => (
          <p
            key={i}
            id={i === 0 ? 'category-seo-summary' : undefined}
            className="category-shop-seo__text"
          >
            {para}
          </p>
        ))}

        <h3 className="category-shop-seo__subtitle">{whyTitle}</h3>
        <ul className="category-shop-seo__why-list">
          {whyBullets.map((item, i) => (
            <li key={i} className="category-shop-seo__why-item">
              {item.label ? (
                <>
                  <strong>{item.label}:</strong> {item.text}
                </>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ul>

        {clusterLinks.length > 0 ? (
          <nav className="category-shop-seo__related" aria-label="Related categories">
            <h3 className="category-shop-seo__subtitle">Related departments</h3>
            <ul className="category-shop-seo__related-list">
              {clusterLinks.map((link) => (
                <li key={link.slug}>
                  <Link to={`/shop?category=${encodeURIComponent(link.slug)}`}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {pillarSections.map((section) => (
          <div key={section.id} className="category-shop-seo__pillar-block">
            <h3 className="category-shop-seo__pillar-heading">{section.heading}</h3>
            {section.paragraphs.map((para, i) => (
              <p key={i} className="category-shop-seo__text">
                {para}
              </p>
            ))}
          </div>
        ))}
      </div>

      {hasBottom ? (
        <div className="category-shop-seo__grid">
          {faqs.length > 0 ? (
            <div className="category-shop-seo__faqs">
              <h3 className="category-shop-seo__panel-title">FAQs</h3>
              <div className="category-shop-seo__accordion">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  const panelId = `category-faq-${categorySlug}-${index}`;
                  return (
                    <div
                      key={panelId}
                      className={`category-shop-seo__faq-item${isOpen ? ' is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="category-shop-seo__faq-trigger"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown size={18} aria-hidden className="category-shop-seo__faq-icon" />
                      </button>
                      <div
                        id={panelId}
                        className="category-shop-seo__faq-panel"
                        hidden={!isOpen}
                        role="region"
                      >
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {priceRows.length > 0 ? (
            <div className="category-shop-seo__prices">
              <h3 className="category-shop-seo__panel-title">Price List</h3>
              <table className="category-shop-seo__price-table">
                <thead>
                  <tr>
                    <th scope="col">Items</th>
                    <th scope="col">Prices</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((row, i) => (
                    <tr key={row._id || `${row.name}-${i}`}>
                      <td>
                        <span className="category-shop-seo__price-index">{i + 1}.</span> {row.name}
                      </td>
                      <td className="category-shop-seo__price-val">{formatRs(row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
