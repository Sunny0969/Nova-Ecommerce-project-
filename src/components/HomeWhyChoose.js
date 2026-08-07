import React, { useEffect, useState } from 'react';
import { Package, Tag, Truck, ShieldCheck } from 'lucide-react';
import { publicAPI } from '../api/storefront';
import { formatPKR } from '../utils/currency';
import { getHomeWhyChooseCards } from '../data/homeWhyChoose';
import './HomeWhyChoose.css';

const ICONS = {
  variety: Package,
  prices: Tag,
  delivery: Truck,
  secure: ShieldCheck
};

export default function HomeWhyChoose() {
  const [deliveryLabel, setDeliveryLabel] = useState(null);

  useEffect(() => {
    let cancelled = false;
    publicAPI
      .homeStats()
      .then((res) => {
        const fromApi = res?.data?.data?.deliveryLabel;
        if (!cancelled && fromApi) setDeliveryLabel(String(fromApi));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const freeDeliveryNote = deliveryLabel
    ? `Get groceries and essentials delivered quickly to your doorstep. ${deliveryLabel}. Count on fresh, quality products arriving when you need them.`
    : `Get groceries and essentials delivered quickly to your doorstep. Free delivery on orders over ${formatPKR(2026)} with next-day options where available.`;

  const cards = getHomeWhyChooseCards(freeDeliveryNote);

  return (
    <section className="section home-why-choose trust-badges" aria-label="Why choose us">
      <div className="container">
        <h2 className="home-why-choose__title">
          Why Bazaar is Pakistan&apos;s Best Online Shop
        </h2>
        <div className="home-why-choose__grid trust-grid">
          {cards.map((card) => {
            const Icon = ICONS[card.icon] || Package;
            return (
              <article key={card.id} className="home-why-choose__card trust-card">
                <div className="home-why-choose__icon-wrap trust-card__icon" aria-hidden>
                  <Icon size={28} strokeWidth={1.75} />
                </div>
                <h3 className="home-why-choose__card-title">{card.title}</h3>
                <p className="home-why-choose__card-text">{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
