import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function RecommendationRow({ title, products, viewAllTo }) {
  const list = Array.isArray(products) ? products : [];
  if (!list.length) return null;

  return (
    <section className="rec-row" aria-label={title || 'Recommendations'}>
      <div className="rec-row__head">
        <h2 className="rec-row__title">{title}</h2>
        {viewAllTo ? (
          <Link to={viewAllTo} className="rec-row__more">
            View all <ChevronRight size={16} aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="rec-row__scroll" role="list">
        {list.map((p) => (
          <div key={p._id || p.slug} className="rec-row__item" role="listitem">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

