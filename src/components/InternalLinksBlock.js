import React from 'react';
import { Link } from 'react-router-dom';
import './InternalLinksBlock.css';

/**
 * Keyword-rich internal links block (2–5 links). Use for blog, legal, product, and category content.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {{ to: string, label: string }[]} props.links
 * @param {'list'|'pills'} [props.variant]
 * @param {string} [props.className]
 */
export default function InternalLinksBlock({
  title = 'Related pages',
  links,
  variant = 'list',
  className = ''
}) {
  const items = Array.isArray(links) ? links.filter((l) => l?.to && l?.label) : [];
  if (items.length === 0) return null;

  if (variant === 'pills') {
    return (
      <nav
        className={`internal-links internal-links--pills ${className}`.trim()}
        aria-label={title}
      >
        {title ? <h3 className="internal-links__title">{title}</h3> : null}
        <div className="internal-links__pills">
          {items.map((item) => (
            <Link key={`${item.to}-${item.label}`} to={item.to} className="internal-links__pill">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className={`internal-links ${className}`.trim()} aria-label={title}>
      <h3 className="internal-links__title">{title}</h3>
      <ul className="internal-links__list">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
