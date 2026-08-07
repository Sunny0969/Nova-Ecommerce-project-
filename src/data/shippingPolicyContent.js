import { businessDisplayName, businessPhoneDisplay } from '../utils/businessContact';

export const SHIPPING_POLICY_META = {
  pageId: 'shipping-policy',
  title: 'Shipping & Service Policy',
  lastUpdated: 'June 2025',
  effectiveSite: 'bazaar-pk.com'
};

export const SHIPPING_POLICY_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    paragraphs: [
      `${businessDisplayName} delivers groceries and household essentials across Pakistan from our operations base in Hyderabad, Sindh. This Shipping & Service Policy describes delivery options, fees, timelines, and the service standards you can expect when you shop on ${SHIPPING_POLICY_META.effectiveSite}.`
    ]
  },
  {
    id: 'coverage',
    title: '1. Delivery coverage',
    paragraphs: [
      'We deliver to addresses throughout Pakistan where courier or in-house delivery partners operate. Enter your full address at checkout — including city, province, and postcode — to see available options and charges for your area.',
      'Some remote or newly added locations may have longer transit times or limited express availability. We are expanding coverage over time.'
    ]
  },
  {
    id: 'options',
    title: '2. Delivery options',
    list: [
      'Standard delivery — economical option for most grocery orders; fees may be based on cart weight or a flat rate shown at checkout.',
      'Express delivery — faster dispatch and transit where available in your city.',
      'Next-day delivery — offered in selected areas for eligible orders placed before the daily cut-off.'
    ],
    tailParagraphs: [
      'Estimated delivery windows are shown at checkout and on your order confirmation. They are guides, not guaranteed arrival times, but we work to meet them whenever possible.'
    ]
  },
  {
    id: 'fees',
    title: '3. Shipping fees & free delivery',
    paragraphs: [
      'Shipping charges depend on the delivery option you select, order weight, and your location. All fees are displayed before you confirm payment.',
      'Free standard delivery may apply when your order subtotal meets the minimum shown at checkout (excluding express or next-day upgrades).',
      'Heavy or bulky items may incur additional weight-based shipping even on standard delivery.'
    ]
  },
  {
    id: 'processing',
    title: '4. Order processing',
    paragraphs: [
      'Orders are typically processed after payment confirmation (or verification for bank transfer orders). You receive status updates by email and in your account when applicable.',
      'During peak demand, public holidays, or severe weather, processing and transit may take longer. We will notify you of significant delays when possible.'
    ]
  },
  {
    id: 'receiving',
    title: '5. Receiving your order',
    list: [
      'Provide a complete delivery address with a reachable phone number.',
      'Someone should be available to receive the order unless you have arranged a safe drop-off with our team in advance.',
      'Inspect items on delivery and report damage or missing products within 24 hours — see our Returns & Refunds Policy.'
    ]
  },
  {
    id: 'service',
    title: '6. Customer service standards',
    paragraphs: [
      `${businessDisplayName} aims to respond to order and delivery enquiries as quickly as possible during business hours.`,
      'Our team can help with order tracking, address updates before dispatch, payment verification, and product questions.',
      `Contact us via the Contact Us page or call ${businessPhoneDisplay} for support.`
    ]
  },
  {
    id: 'limitations',
    title: '7. Limitations',
    paragraphs: [
      'We are not responsible for delays caused by events outside our reasonable control, including severe weather, strikes, traffic restrictions, or carrier disruptions.',
      'Incorrect addresses or unreachable phone numbers provided at checkout may result in failed delivery attempts and additional fees where applicable.'
    ]
  },
  {
    id: 'contact',
    title: '8. Office & contact',
    paragraphs: [
      `${businessDisplayName} — Al Meeran Town, Citizen Colony, Hyderabad, Sindh, Pakistan.`,
      `Phone: ${businessPhoneDisplay}. For delivery help, include your order number when you contact us.`
    ]
  }
];
