/**
 * Terms & Conditions — Bazaar online store (bazaar-pk.com).
 */
import { businessDisplayName, businessPhoneDisplay } from '../utils/businessContact';

export const TERMS_META = {
  title: 'Terms and Conditions',
  lastUpdated: 'June 2025',
  effectiveSite: 'bazaar-pk.com'
};

export const TERMS_SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    paragraphs: [
      `By using the ${businessDisplayName} website ("Site", "Platform") at ${TERMS_META.effectiveSite}, you agree to these Terms and Conditions ("Terms"), our Privacy Policy, and our returns and refund practices described on the Site and in our FAQs.`,
      `These Terms are between you and ${businessDisplayName} ("we", "us", or "our") and govern your use of the Site and related services, including browsing, ordering, payment, and delivery. If you access or use the Platform, you accept these Terms. If you act on behalf of a business, you confirm you have authority to bind that entity. If you do not agree, do not use the Site.`,
      'We may update these Terms at any time by posting revised terms on the Site. Continued use after changes take effect means you accept the updated Terms. If you disagree with a change, stop using the Site.'
    ]
  },
  {
    id: 'conditions-of-use',
    title: '2. Conditions of Use',
    paragraphs: ['When using our Services, you agree that you will not:'],
    list: [
      'Use the Site in violation of applicable laws or third-party rights',
      'Use the Services if you cannot form legally binding contracts (for example, if you are under 18) or if your account has been suspended',
      'Fail to pay for items you order',
      'Post false, misleading, abusive, or unlawful content',
      'Interfere with other users, listings, feedback systems, or Site security',
      'Transfer your account to another person without our consent',
      'Send spam, viruses, or harmful code',
      'Use automated tools to scrape or access the Site without permission',
      'Overload or disrupt our infrastructure',
      'Copy, reverse engineer, or misuse Site content, software, or trademarks',
      'Use the Site for fraud or unlawful activity'
    ],
    tailParagraphs: [
      'We may suspend or terminate access if we reasonably believe these rules have been breached.'
    ]
  },
  {
    id: 'accounts',
    title: '3. Accounts & Information',
    paragraphs: [
      'To place orders or use certain features, you may need to create an account and provide accurate information such as your name, email, phone number, and delivery address. You are responsible for keeping this information current.',
      'You are responsible for safeguarding your login details and all activity under your account, whether authorised by you or not. Notify us promptly if you suspect unauthorised access.',
      'We may refuse access, suspend, or terminate accounts, or request updated information at our discretion. We are not liable for losses arising from account suspension where permitted by law.'
    ]
  },
  {
    id: 'platform',
    title: '4. The Platform & Services',
    paragraphs: [
      `${businessDisplayName} operates an online marketplace and retail platform that enables you to purchase groceries and household products listed on the Site. Product availability, pricing, and fulfilment are subject to confirmation at checkout and dispatch.`,
      'We aim to keep the Site available but cannot guarantee uninterrupted access. Maintenance, updates, or technical issues may cause temporary downtime without prior notice.',
      'We may contact you by email, SMS, or phone regarding orders, account matters, service updates, or—where permitted—promotional messages. Standard carrier charges may apply.'
    ]
  },
  {
    id: 'privacy',
    title: '5. Privacy',
    paragraphs: [
      `Our Privacy Policy explains how we collect and use personal information. By using the Site, you acknowledge that policy. If you object to our data practices, please do not use the Services.`
    ]
  },
  {
    id: 'submissions',
    title: '6. Reviews & Submissions',
    paragraphs: [
      'Content you submit to the Site—such as reviews, comments, or suggestions—may be used by us in connection with operating and promoting the Services. Do not submit content that is false, offensive, or infringes others\' rights.',
      'We may remove or edit submissions that violate these Terms or applicable law.'
    ]
  },
  {
    id: 'ip',
    title: '7. Trademarks & Copyright',
    paragraphs: [
      `${businessDisplayName} names, logos, graphics, and Site design are protected by intellectual property laws. You may not use our branding without written permission.`,
      'Product names and third-party marks on the Site belong to their respective owners. Site content is protected by copyright; unauthorised reproduction is prohibited.'
    ]
  },
  {
    id: 'disclaimer',
    title: '8. Disclaimer',
    paragraphs: [
      'You use the Site and place orders at your own risk. We strive for accurate product information but do not warrant that descriptions, prices, images, or availability are error-free.',
      'Products are provided "as is" to the extent permitted by law. We disclaim warranties regarding merchantability, fitness for a particular purpose, or non-infringement unless required by applicable law.',
      'We are not liable for actions of third-party payment, delivery, or service providers beyond what is required by law.'
    ]
  },
  {
    id: 'indemnity',
    title: '9. Indemnity',
    paragraphs: [
      'You agree to indemnify and hold harmless Bazaar and its affiliates, officers, and employees from claims, losses, or expenses (including reasonable legal fees) arising from your breach of these Terms, misuse of the Site, or violation of law or third-party rights.'
    ]
  },
  {
    id: 'third-parties',
    title: '10. Third Parties',
    paragraphs: [
      'The Site may link to or integrate third-party services such as payment processors or delivery partners. Their terms and privacy policies apply to those services. We are not responsible for third-party websites or offerings beyond our legal obligations.'
    ]
  },
  {
    id: 'losses',
    title: '11. Limitation of Liability',
    paragraphs: [
      'To the extent permitted by law, we are not responsible for indirect or consequential losses (including lost profits, revenue, data, or goodwill) that were not reasonably foreseeable when you started using the Site.',
      'Nothing in these Terms limits rights you may have under applicable consumer protection law.'
    ]
  },
  {
    id: 'amendments',
    title: '12. Changes, Termination & Force Majeure',
    paragraphs: [
      'We may change the Site, policies, or these Terms at any time. Changes apply from the date posted unless law requires otherwise for existing orders.',
      'We may terminate or restrict your access if you breach these Terms. You may stop using the Site at any time.',
      'We are not liable for delay or failure caused by events beyond our reasonable control (force majeure).'
    ]
  },
  {
    id: 'governing-law',
    title: '13. Governing Law',
    paragraphs: [
      'These Terms are governed by the laws of the Islamic Republic of Pakistan. Disputes shall first be addressed through our customer support channels. If unresolved, disputes may be referred to arbitration under applicable Pakistani law, unless mandatory consumer protections require otherwise.'
    ]
  },
  {
    id: 'conditions-of-sale',
    title: '14. Conditions of Sale',
    paragraphs: [
      'When you place an order, you make an offer to purchase the listed products. Order confirmation and status updates do not guarantee acceptance until the order is processed and dispatched.',
      'Commercial terms such as price, availability, and delivery timelines are displayed on the Site and confirmed at checkout. We or our fulfilment partners may cancel an order before dispatch—for example due to stock issues, pricing errors, suspected fraud, or failed payment verification. Prepaid amounts for cancelled orders will be refunded according to our refund policy.',
      'Orders are intended for normal household consumption unless otherwise agreed. We may limit quantities that appear excessive for individual use.',
      'For returns, refunds, and exchanges, see our FAQs and Contact Us page or speak with customer support.'
    ]
  },
  {
    id: 'pricing',
    title: '15. Pricing, Availability & Orders',
    paragraphs: [
      'Prices are shown in Pakistani Rupees (PKR) unless stated otherwise. Prices and availability may change before checkout is completed. The price charged is the price shown when you confirm payment.',
      'We try to display accurate pricing but errors may occur. We may cancel or contact you about orders affected by obvious pricing mistakes.',
      'We may request verification of identity, address, or payment details before accepting high-risk orders. Failure to respond may result in cancellation.',
      'Estimated delivery times are guides only and are not guaranteed.'
    ]
  },
  {
    id: 'taxes',
    title: '16. Taxes & Fees',
    paragraphs: [
      'You are responsible for applicable taxes, fees, and charges associated with your purchase unless stated otherwise at checkout.'
    ]
  },
  {
    id: 'contact',
    title: '17. Contact Us',
    paragraphs: [
      `Questions about these Terms may be sent through our Contact Us page or by calling ${businessPhoneDisplay}.`
    ]
  }
];
