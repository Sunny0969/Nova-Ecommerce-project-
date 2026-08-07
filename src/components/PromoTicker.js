import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { publicAPI } from '../api/storefront';
import './PromoTicker.css';

const TICKER_HEIGHT = '2.125rem';

function PromoTickerItem({ item }) {
  const inner = (
    <>
      {item.code ? (
        <span className="promo-ticker__code" aria-label={`Voucher code ${item.code}`}>
          {item.code}
        </span>
      ) : null}
      <span className="promo-ticker__text">{item.text}</span>
    </>
  );

  if (item.href) {
    return (
      <Link to={item.href} className="promo-ticker__item promo-ticker__item--link">
        {inner}
      </Link>
    );
  }

  return <span className="promo-ticker__item">{inner}</span>;
}

export default function PromoTicker() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    publicAPI
      .promoTicker()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.items;
        if (Array.isArray(list) && list.length) {
          setItems(list);
        }
      })
      .catch(() => {
        /* no promos */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const trackItems = useMemo(() => [...items, ...items], [items]);

  const showBar = !loaded || items.length > 0;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--promo-ticker-height', showBar ? TICKER_HEIGHT : '0px');
    return () => {
      root.style.setProperty('--promo-ticker-height', '0px');
    };
  }, [showBar]);

  if (!loaded) {
    return (
      <div className="promo-ticker promo-ticker--placeholder" aria-hidden="true">
        <div className="promo-ticker__inner" />
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <div className="promo-ticker" role="region" aria-label="Promotions and voucher codes">
      <div className="promo-ticker__inner">
        <span className="promo-ticker__badge" aria-hidden>
          <Tag size={13} strokeWidth={2.25} />
          <span className="promo-ticker__badge-label">Offers</span>
        </span>
        <div className="promo-ticker__viewport">
          <div className="promo-ticker__track">
            {trackItems.map((item, index) => (
              <React.Fragment key={`${item.id}-${index}`}>
                <PromoTickerItem item={item} />
                <span className="promo-ticker__sep" aria-hidden>
                  ◆
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
