/**
 * Contact Us page copy — Bazaar.
 */
import { businessDisplayName, businessPhoneDisplay } from '../utils/businessContact';

export const CONTACT_HERO = {
  title: 'Contact Us',
  subtitle: "We're here 24/7 to make your shopping easier"
};

export const CONTACT_INTRO = {
  paragraphs: [
    `At ${businessDisplayName}, you always come first. Our customer service is built to keep your shopping smooth and hassle-free. Whether you need help with an order, want to track a delivery, or share feedback, the ${businessDisplayName} team is ready to support you.`
  ]
};

export const CONTACT_REACH = {
  title: `How to reach ${businessDisplayName}`,
  paragraphs: [
    `Our support team can help with orders, delivery tracking, payments, and product questions. We aim to make your online grocery shopping reliable at every step.`
  ],
  phoneLabel: 'Or call on',
  phoneDisplay: businessPhoneDisplay
};

export const CONTACT_FEEDBACK = {
  title: `${businessDisplayName} Complaints & Feedback`,
  paragraphs: [
    'Your voice matters to us. If you have a complaint, suggestion, or positive experience to share, contact us using the options on this page. Every message is reviewed so we can improve your shopping journey with us.'
  ]
};

export const CONTACT_HOURS = '24/7 customer support';
