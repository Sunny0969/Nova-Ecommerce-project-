import React from 'react';
import { formatPKR } from '../utils/currency';
import { Link } from 'react-router-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import toast from 'react-hot-toast';
import { productImageUrl } from '../lib/productImage';

/**
 * @param {object} props
 * @param {object} props.line — { product, quantity, price, lineTotal }
 * @param {string} [props.animationDelay]
 * @param {(productRef: string, quantity: number) => void} props.onUpdateQuantity
 * @param {(productRef: string) => void} props.onRemove
 */
export default function CartItem({ line, animationDelay, onUpdateQuantity, onRemove }) {
  const p = line.product || {};
  const ref = String(p._id || line.product || '');
  const img = productImageUrl(p);
  const unit = Number(line.price) || 0;
  const lineTotal = Number(line.lineTotal ?? unit * (line.quantity || 0)) || 0;
  const stockRaw = p.stock ?? p.stockQuantity;
  const stock =
    stockRaw != null && Number.isFinite(Number(stockRaw)) ? Math.floor(Number(stockRaw)) : null;
  const atMax = stock != null && line.quantity >= stock;

  const bump = (delta) => {
    const next = line.quantity + delta;
    if (next < 1) return;
    if (stock != null && next > stock) {
      toast.error(`Only ${stock} in stock for ${p.name || 'this item'}`);
      return;
    }
    onUpdateQuantity(ref, next);
  };

  return (
    <article className="cart-item" style={animationDelay ? { animationDelay } : undefined}>
      <div className="cart-item-img">
        {img ? (
          <LazyLoadImage src={img} alt={p.name || ''} className="cart-item-img__photo" effect="blur" />
        ) : (
          <span className="cart-item-img__emoji" aria-hidden>
            📦
          </span>
        )}
      </div>
      <div className="cart-item-info">
        <Link to={`/shop/${p.slug || ''}`} className="cart-item-name-link">
          <h3 className="cart-item-name cart-item__name">{p.name}</h3>
        </Link>
        <p className="cart-item-unit-price" aria-label="Unit price">
          {formatPKR(unit)} <span className="cart-item-unit-price__each">each</span>
        </p>
        <div className="qty-control" aria-label="Quantity">
          <button type="button" className="qty-btn" onClick={() => bump(-1)} aria-label="Decrease quantity">
            −
          </button>
          <span className="qty-display">{line.quantity}</span>
          <button
            type="button"
            className="qty-btn"
            onClick={() => bump(1)}
            disabled={atMax}
            aria-label={atMax ? 'Maximum stock reached' : 'Increase quantity'}
          >
            +
          </button>
        </div>
        {stock != null ? (
          <span className="cart-item__stock-hint">{stock} in stock</span>
        ) : null}
      </div>
      <div className="cart-item__price">
        <p className="cart-item__total" aria-label="Line total">
          {formatPKR(lineTotal)}
        </p>
        <button type="button" className="cart-item__remove" onClick={() => onRemove(ref)}>
          Remove
        </button>
      </div>
    </article>
  );
}
