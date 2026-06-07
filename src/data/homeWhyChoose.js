/**
 * Homepage "Why choose us" — 4 cards (Bazaar-style + existing site benefits merged).
 */
export function getHomeWhyChooseCards(freeDeliveryLabel) {
  const deliveryNote =
    freeDeliveryLabel ||
    'Get your order delivered quickly and on time, right to your doorstep with next-day options across Pakistan.';

  return [
    {
      id: 'variety',
      icon: 'variety',
      title: 'Wide Variety of Products',
      description:
        'From fresh groceries and pantry staples to handicrafts and household essentials, shop local and international brands in one place — on our website with secure checkout and fast reordering.'
    },
    {
      id: 'prices',
      icon: 'prices',
      title: 'Best Prices Every Day',
      description:
        'Enjoy everyday low prices, exclusive offers, bundle deals, and sale discounts. Pay your way with cash on delivery or card — always transparent pricing at checkout.'
    },
    {
      id: 'delivery',
      icon: 'delivery',
      title: 'Fast, Reliable Delivery',
      description: deliveryNote
    },
    {
      id: 'secure',
      icon: 'secure',
      title: 'Secure Payments',
      description:
        'SSL-encrypted checkout keeps your details safe. Pay with card, PayPal, and more — plus easy returns and friendly support when you need help.'
    }
  ];
}
