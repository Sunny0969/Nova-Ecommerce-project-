import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import './HomeWhyChoose.css';

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: 'Free Shipping',
    sub: 'On orders above Rs. 999'
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    sub: '100% safe & secure'
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    sub: 'Within 7 days'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    sub: 'Always here to help'
  }
];

export default function HomeWhyChoose() {
  return (
    <section className="fashion-trust-section" aria-label="Customer assurances">
      <div className="container">
        <div className="fashion-trust-bar">
          {TRUST_ITEMS.map(({ icon: Icon, title, sub }, idx) => (
            <div key={title} className={`fashion-trust-item ${idx !== 0 ? 'fashion-trust-item--bordered' : ''}`}>
              <div className="fashion-trust-icon-box" aria-hidden="true">
                <Icon size={26} strokeWidth={1.8} />
              </div>
              <div className="fashion-trust-text">
                <h3 className="fashion-trust-title">{title}</h3>
                <p className="fashion-trust-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
