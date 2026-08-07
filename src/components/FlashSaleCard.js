import React from 'react';
import { Link } from 'react-router-dom';
import { productImageUrl } from '../lib/productImage';
import { buildProductImageAlt } from '../utils/imageAlt';
import { getProductSalePrices } from '../lib/productSale';
import { formatPKR } from '../utils/currency';
import ProductImage, { FLASH_SALE_IMAGE_WIDTH, FLASH_SALE_IMAGE_HEIGHT } from './ProductImage';
import { buildProductPath, getProductCategorySlug } from '../utils/urls';
import ProductSaleRibbon from './ProductSaleRibbon';
import { useProductPrefetch } from '../hooks/useProductPrefetch';

export default function FlashSaleCard({ product, imagePriority = false }) {
  const slug = product?.slug || product?.productId || '';
  const prefetchHandlers = useProductPrefetch(slug);
  const sale = getProductSalePrices(product);
  if (!sale) return null;
  const imageUrl = productImageUrl(product);
  const productPath = buildProductPath(slug, getProductCategorySlug(product));

  const discountPct = sale.discountPercent > 0 ? sale.discountPercent : null;

  return (
    <Link to={productPath} className="flash-sale-card" {...prefetchHandlers}>
      <div className="flash-sale-card__image-wrap">
        {discountPct != null ? (
          <ProductSaleRibbon discountPercent={discountPct} />
        ) : null}
        {imageUrl ? (
          <ProductImage
            className="flash-sale-card__img"
            src={imageUrl}
            alt={buildProductImageAlt(product)}
            width={FLASH_SALE_IMAGE_WIDTH}
            height={FLASH_SALE_IMAGE_HEIGHT}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 25vw, 160px"
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
