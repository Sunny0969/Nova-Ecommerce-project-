import { businessDisplayName, businessPhoneDisplay } from '../utils/businessContact';

export const RETURNS_REFUND_META = {
  pageId: 'returns-refund',
  title: 'Returns & Refunds Policy',
  lastUpdated: 'June 2025',
  effectiveSite: 'bazaar-pk.com'
};

export const RETURNS_REFUND_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    paragraphs: [
      `${businessDisplayName} wants you to be satisfied with every order. This Returns & Refunds Policy explains when you may cancel an order, return a product, or request a refund when shopping on ${RETURNS_REFUND_META.effectiveSite}.`,
      'This policy works together with our Terms & Conditions, Shipping Policy, and FAQs. Where Pakistani consumer protection law gives you stronger rights, those rights apply.'
    ]
  },
  {
    id: 'eligibility',
    title: '1. What can be returned',
    paragraphs: ['The following general rules apply to grocery and household orders:'],
    list: [
      'Non-perishable, unopened items in original sealed packaging may be eligible within 7 days of delivery.',
      'Items that are damaged, defective, expired, or incorrectly supplied are eligible for review regardless of category.',
      'Fresh produce, dairy, meat, frozen foods, and opened personal-care items are generally not returnable unless faulty or wrong.',
      'Digital goods, gift cards, or promotional free items follow the terms shown at checkout.',
      'Items must be returned in resalable condition with labels and batch information intact where applicable.'
    ]
  },
  {
    id: 'non-returnable',
    title: '2. Non-returnable items',
    list: [
      'Perishable groceries past safe handling windows',
      'Opened food, beverages, or supplements unless defective',
      'Custom or clearance items marked “final sale” at checkout',
      'Products damaged after delivery due to misuse or improper storage'
    ],
    tailParagraphs: [
      'If you are unsure whether your item qualifies, contact us before disposing of the product.'
    ]
  },
  {
    id: 'reporting',
    title: '3. How to report an issue',
    paragraphs: [
      'Contact customer support within 24 hours of delivery for damaged, missing, expired, or incorrect items. Include your order number, product name, and clear photos where helpful.',
      `Reach us through the Contact Us page or call ${businessPhoneDisplay} during support hours. We may request additional information to verify the issue with our packing and dispatch team.`
    ]
  },
  {
    id: 'refunds',
    title: '4. Refunds',
    paragraphs: [
      'Approved refunds are returned to the original payment method where possible (card, wallet, or agreed alternative for COD/bank transfer orders).',
      'Refund processing typically begins within 2–3 business days after approval. Banks and card providers may take an additional 5–10 business days to show the credit.',
      'Partial refunds may apply when only part of an order is affected. Delivery fees are refunded only when the entire order is cancelled before dispatch or when the error was on our side.',
      'Wallet refunds may be offered for faster resolution when you hold a Bazaar account.'
    ]
  },
  {
    id: 'replacements',
    title: '5. Replacements & exchanges',
    paragraphs: [
      'Where stock allows, we may offer a replacement instead of a refund for incorrect or damaged goods.',
      'Exchanges for change-of-mind are limited to eligible non-perishable products and depend on availability. You may need to place a new order for the preferred item.'
    ]
  },
  {
    id: 'cancellations',
    title: '6. Order cancellations',
    paragraphs: [
      'You may request cancellation before picking or dispatch begins. Orders already out for delivery usually cannot be cancelled.',
      'If a prepaid order is cancelled by you (before dispatch) or by us (for example due to stock or pricing error), a full refund of the amount paid will be issued according to this policy.'
    ]
  },
  {
    id: 'cod',
    title: '7. Cash on delivery & bank transfer',
    list: [
      'COD orders cancelled before dispatch incur no charge.',
      'Approved refunds for paid COD or Easypaisa/bank transfer orders may be issued via Bazaar Wallet or an agreed refund channel.',
      'Bank transfer orders with payment proof on file are verified before refunds are released.'
    ]
  },
  {
    id: 'contact',
    title: '8. Contact',
    paragraphs: [
      `For returns and refund requests, visit Contact Us or call ${businessPhoneDisplay}. Have your order number ready so we can assist you quickly.`
    ]
  }
];
