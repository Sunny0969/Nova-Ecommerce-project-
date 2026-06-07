import React from 'react';
import { Link } from 'react-router-dom';
import { productImageUrl } from '../lib/productImage';
import { getProductSalePrices } from '../lib/productSale';
import ProductImage from './ProductImage';
import { formatPKR } from '../utils/currency';
import ProductSaleRibbon from './ProductSaleRibbon';

export default function FlashSaleCard({ product, imagePriority = false }) {
  const sale = getProductSalePrices(product);
  if (!sale) return null;

  const slug = product.slug || product.productId;
  const imageUrl = productImageUrl(product);

  const discountPct = sale.discountPercent > 0 ? sale.discountPercent : null;

  return (
    <Link to={`/shop/${encodeURIComponent(slug || '')}`} className="flash-sale-card">
      <div className="flash-sale-card__image-wrap">
        {discountPct != null ? (
          <ProductSaleRibbon discountPercent={discountPct} />
        ) : null}
        {imageUrl ? (
          <ProductImage
            className="flash-sale-card__img"
            src={imageUrl}
            alt={product.name}
            priority={imagePriority}
          />
        ) : (
          <span className="flash-sale-card__placeholder" aria-hidden>
            {product.emoji || '📦'}
          </span>
        )}
      </div>
      <h3 className="flash-sale-card__title">{product.name}</h3>
      <div className="flash-sale-card__prices">
        <span className="flash-sale-card__price flash-sale-card__price--sale">
          {formatPKR(sale.salePrice)}
        </span>
        <span className="flash-sale-card__price flash-sale-card__price--was">
          {formatPKR(sale.originalPrice)}
        </span>
      </div>
    </Link>
  );
}
