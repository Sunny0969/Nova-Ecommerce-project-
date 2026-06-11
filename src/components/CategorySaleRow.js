import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { buildCategorySalePath } from '../utils/urls';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function CategorySaleRow({ category, products, onAddToCart }) {
  const scrollRef = useRef(null);
  const slug = category?.slug || '';
  const name = category?.name || 'Category';
  const list = Array.isArray(products) ? products : [];

  if (!list.length) return null;

  const shopUrl = buildCategorySalePath(slug);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className="home-cat-sale-row" aria-label={`${name} on sale`}>
      <div className="home-cat-sale-row__head">
        <div className="home-cat-sale-row__title-wrap">
          <h2 className="home-cat-sale-row__title">{name}</h2>
          <Link to={shopUrl} className="home-cat-sale-row__view-more">
            View More
          </Link>
        </div>
        <div className="home-cat-sale-row__nav">
          <button
            type="button"
            className="home-cat-sale-row__nav-btn"
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${name} products left`}
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="home-cat-sale-row__nav-btn"
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${name} products right`}
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="home-cat-sale-row__scroll rec-row__scroll" ref={scrollRef} role="list">
        {list.map((product, idx) => (
          <div key={product._id || product.slug} className="rec-row__item" role="listitem">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              imagePriority={idx < 4}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
