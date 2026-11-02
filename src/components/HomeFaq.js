import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink } from 'lucide-react';
import './HomeFaq.css';

const HOME_FAQ_ITEMS = [
  {
    q: 'How do I order online from Bazaar in Hyderabad?',
    a: 'Browse products on bazaar-pk.com, add items to your cart, fill in your Hyderabad delivery address, choose cash on delivery or bank transfer (Easypaisa / JazzCash), and place your order. You get an order confirmation instantly. No account is required — guest checkout is available.'
  },
  {
    q: 'What payment methods does Bazaar accept?',
    a: 'Bazaar accepts cash on delivery (COD) across Pakistan. For online payment, you can use Easypaisa or JazzCash mobile wallets by transferring to our registered number. This keeps your transaction simple and secure without needing a credit card.'
  },
  {
    q: 'How fast is delivery in Hyderabad and the rest of Pakistan?',
    a: 'Orders within Hyderabad are typically delivered in 1–2 business days. For the rest of Pakistan, standard delivery takes 3–5 business days. Express and next-day options are available at checkout for faster delivery.'
  },
  {
    q: 'What is Bazaar\'s return and refund policy?',
    a: 'Bazaar offers a 7-day return window from the date of delivery. If your item is damaged, defective, or not as described, contact our support team and we will arrange a free return pickup. Refunds are credited to your Bazaar wallet or original payment method within 3–5 business days.'
  },
  {
    q: 'Is Bazaar a trusted online store in Pakistan?',
    a: 'Yes. Bazaar uses SSL-encrypted checkout, verifies all sellers, and provides a transparent return policy. Our customer support team is available via WhatsApp and phone in Hyderabad. Every order includes tracking so you know exactly when your delivery arrives.'
  },
  {
    q: 'Can I buy school bags and supplies on Bazaar?',
    a: 'Absolutely. Bazaar stocks a wide range of school bags, stationery, and educational supplies with competitive pricing. Search "school bag" on our shop page to browse options with detailed images, specs, and customer reviews. Delivery is available across Hyderabad and Pakistan.'
  }
];

function FaqAccordionItem({ item, isOpen, onToggle, index }) {
  const panelId = `home-faq-panel-${index}`;
  const triggerId = `home-faq-trigger-${index}`;

  return (
    <div className={`home-faq__item${isOpen ? ' home-faq__item--open' : ''}`}>
      <h3 className="home-faq__item-heading">
        <button
          id={triggerId}
          type="button"
          className="home-faq__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span>{item.q}</span>
          <ChevronDown size={18} strokeWidth={2} className="home-faq__chevron" aria-hidden />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="home-faq__panel"
        hidden={!isOpen}
      >
        <p className="home-faq__answer">{item.a}</p>
      </div>
    </div>
  );
}

export default function HomeFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section home-faq" id="home-faq" aria-label="Frequently asked questions">
      <div className="container">
        <h2 className="home-faq__title">
          Frequently Asked Questions About Shopping on Bazaar
        </h2>
        <p className="home-faq__subtitle">
          Quick answers to the most common questions from shoppers in Hyderabad and Pakistan.
        </p>

        <div className="home-faq__grid">
          <div className="home-faq__list" role="list">
            {HOME_FAQ_ITEMS.map((item, i) => (
              <FaqAccordionItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </div>

          <aside className="home-faq__sidebar">
            <div className="home-faq__sidebar-card">
              <p className="home-faq__sidebar-title">Still have questions?</p>
              <p className="home-faq__sidebar-text">
                Check our full FAQ page or reach out to our Hyderabad-based support team.
              </p>
              <Link to="/faqs" className="home-faq__sidebar-link">
                View all FAQs →
              </Link>
              <Link to="/contact-us" className="home-faq__sidebar-link home-faq__sidebar-link--muted">
                Contact support
              </Link>
            </div>

            <div className="home-faq__sidebar-card home-faq__sidebar-card--source">
              <p className="home-faq__sidebar-source-title">
                <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
                Helpful Resources
              </p>
              <ul className="home-faq__sidebar-source-list">
                <li>
                  <a
                    href="https://www.fia.gov.pk/en/cyber-crime"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    FIA Cyber Crime Wing — safe online shopping
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.statista.com/outlook/emo/ecommerce/pakistan"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pakistan e-commerce stats (Statista)
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/** FAQ data export for JSON-LD schema */
export { HOME_FAQ_ITEMS };
