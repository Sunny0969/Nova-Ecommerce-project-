/**
 * Privacy Policy — Bazaar online grocery store.
 * Adapted for bazaar-pk.com; edit legal copy here only.
 */
import { businessDisplayName, businessPhoneDisplay } from '../utils/businessContact';

export const PRIVACY_POLICY_META = {
  title: 'Privacy Policy',
  lastUpdated: 'June 2025',
  effectiveSite: 'bazaar-pk.com'
};

export const PRIVACY_POLICY_SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    paragraphs: [
      `This privacy policy ("Policy") explains how ${businessDisplayName} ("we", "us", or "our") collects, uses, discloses, and transfers your information when you use our website at ${PRIVACY_POLICY_META.effectiveSite} (the "Site"), related mobile experiences where available, and other connected services including checkout, order fulfilment, delivery updates, and customer support (collectively, the "${businessDisplayName} Services").`,
      `This Policy forms part of the Terms of Use for ${businessDisplayName} Services. Capitalized terms used here but not defined have the same meaning as in the Terms of Use.`,
      `${businessDisplayName} provides an online grocery and essentials shopping platform where users can browse products, place orders, make payments, and receive delivery. Please note that "Services" includes any future services we may offer.`,
      'We may update this Policy as we improve and expand our Services. Please review it periodically. By accessing the Site or using our Services, you consent to the collection, storage, and use of the information you provide (including updates you submit) as described here.',
      `We respect the privacy of users of ${businessDisplayName} Services ("Users" or "you") and take reasonable steps to protect it. Information we collect includes: (a) information you supply, and (b) information collected automatically when you use the Site or Services (together, "Information"). By using ${businessDisplayName} Services, you agree to this Policy. If you do not agree, please do not use our Services.`
    ]
  },
  {
    id: 'information-supplied',
    title: '1. Information Supplied by Users',
    paragraphs: [
      'To use certain Services, you may need to provide personal information during registration or checkout, which may include: (a) your name, (b) email address, (c) phone number, (d) delivery address, (e) payment-related details processed through our payment partners, and (f) other information required to complete orders or verify identity where applicable.',
      'This Information helps us provide Services, process orders, arrange delivery, and improve your shopping experience on our Site.',
      'For some services we may require a contact or billing address. We may also collect additional information from time to time through the Site to improve our Services. We do not share this data with third parties except as described in this Policy.',
      'Information is service-dependent. We may use it to provide Services, maintain and improve the platform, develop new features, and communicate with you about orders and account activity.',
      'We may use your email address and phone number for service messages, order updates, and—where permitted—marketing or administrative notices (such as major policy changes, customer support, or billing-related messages).',
      'Information you provide is not treated as personal information if it is freely available in the public domain or is not classified as personal information under applicable law.',
      'Reviews, comments, or messages you post in public areas of the Site may become published content and are not treated as personal information under this Policy.',
      'If you choose not to provide required Information, we may be unable to offer certain Services. We will try to notify you when information is required. We may contact registered users from time to time to keep account details current.'
    ]
  },
  {
    id: 'information-automatic',
    title: '2. Information Automatically Tracked While Using the Site',
    paragraphs: [
      'Order and transaction records: We store order history, payment status, and related records using secure third-party infrastructure providers.',
      'Delivery information: We store delivery addresses and contact details needed to fulfil orders and send status updates.',
      'Analytics: We may use analytics tools (such as Google Analytics) to understand how visitors use the Site and to improve performance and content.',
      'Log file information: Our servers may automatically collect limited technical data when you visit the Site, including IP address, browser type, device information, operating system, and connection details.',
      'Cookies: We use cookies and similar technologies to improve Site responsiveness, remember preferences, and understand usage patterns. By continuing to use the Site, you agree to this use as described here. You can adjust cookie settings in your browser; limiting cookies may affect some features.',
      'We use cookies and related technologies for site analysis, security, and—where applicable—marketing. Third-party partners may also set cookies subject to their own policies.'
    ]
  },
  {
    id: 'third-party-links',
    title: '3. Links to Third-Party Sites',
    paragraphs: [
      'The Site may include links to third-party websites (such as payment providers, social networks, or partner services). Those sites are governed by their own privacy policies. Once you leave our Site, information you provide on another site is handled under that site\'s policy, which may differ from ours.',
      'If you cannot find a third party\'s privacy policy, contact that website directly for more information.'
    ]
  },
  {
    id: 'information-sharing',
    title: '4. Information Sharing',
    paragraphs: [
      'Information collected may be shared with service providers who help us operate the Site (such as hosting, payment processing, delivery partners, and customer support tools). We take reasonable steps to require these providers to protect your information and use it only for agreed purposes.',
      'Partners may contact you in connection with services you use unless you opt out where applicable.',
      'We may access or process information where required to verify identity, prevent fraud, comply with law, respond to lawful requests from courts or authorities, or enforce our Terms of Use.',
      'We do not share individual user details such as name, phone, email, or order history with other customers unless you explicitly agree. We may present aggregated statistics (for example, overall usage trends) that do not identify individual users.',
      'By using our Services, you acknowledge that information may be stored or processed in Pakistan or other countries where we or our providers operate. Data protection laws in those locations may differ from those where you live.'
    ]
  },
  {
    id: 'access-update',
    title: '5. Accessing and Updating Personal Information',
    paragraphs: [
      'When you use the Site, we will try—when you request it—to give you access to your Information and to correct inaccurate or incomplete personal data where feasible, subject to legal or legitimate business retention requirements.',
      'We may ask you to verify your identity before processing access, correction, or deletion requests. We may decline requests that are repetitive, impractical, risk others\' privacy, or are not required by law.',
      'Where we provide access or correction, we generally do so without charge unless the effort required is disproportionate.',
      'After you delete Information, residual copies may remain on backup systems for a period before permanent removal.'
    ]
  },
  {
    id: 'storage-backup',
    title: '6. Information Storage and Backup',
    paragraphs: [
      'We maintain backups of account and order data on secure cloud infrastructure to support service continuity and recovery.',
      'We may use order and usage data in aggregated form to understand shopping patterns and improve recommendations and site features.',
      'We retain User Information for as long as needed to provide Services, comply with law, resolve disputes, and enforce agreements. When Services are no longer relevant to a User, we remove or anonymize Information in line with our retention practices.'
    ]
  },
  {
    id: 'information-security',
    title: '7. Information Security',
    paragraphs: [
      'We use appropriate technical and organisational measures to protect against unauthorised access, alteration, disclosure, or loss of data. These include access controls, encryption where appropriate, and review of our data practices.',
      'Information is stored in controlled systems with restricted access. Security measures are reviewed and updated as needed.',
      'No method of transmission over the internet or electronic storage is completely secure. We work to protect your information but cannot guarantee absolute security.',
      'We aim to comply with applicable data protection requirements in the jurisdictions where we operate. If we become aware of a breach affecting your unencrypted personal information, we will notify you where required by law, without unreasonable delay.'
    ]
  },
  {
    id: 'data-processing',
    title: '8. Purpose of Data Processing',
    paragraphs: [
      'We collect and process personal information where we have a lawful basis to do so. Our main purposes include delivering and personalising the shopping experience on our Site. If you do not provide required information, we may not be able to complete orders or provide certain features.',
      'We use your information to:'
    ],
    list: [
      'Register and maintain your account',
      'Process orders, payments, and deliveries',
      'Provide customer and technical support',
      'Send transactional messages about orders, account activity, and service updates',
      'Send marketing communications where you have agreed or where permitted by law',
      'Determine delivery areas and show relevant products or offers',
      'Improve the Site, analyse usage, and measure advertising effectiveness',
      'Prevent fraud, enforce our Terms of Use, and comply with legal obligations'
    ],
    tailParagraphs: [
      'We may use your information with your consent for specific features (for example, location-based delivery options or personalised offers).',
      'When you contact us by email or through support channels, you agree that we may respond by electronic means.'
    ]
  },
  {
    id: 'revocation',
    title: '9. Revocation of Consent',
    paragraphs: [
      'You may withdraw consent to processing of your personal information for the future where consent is the legal basis. Withdrawal does not affect processing that is permitted or required without consent under applicable law.'
    ]
  },
  {
    id: 'responsible-org',
    title: '10. Responsible Organization for Data Collection',
    paragraphs: [
      `${businessDisplayName} Services are provided and regulated by ${businessDisplayName}. ${businessDisplayName} is responsible for the collection, storage, and processing of Users' personal information in connection with the Site.`
    ]
  },
  {
    id: 'updates',
    title: '11. Updates and Changes',
    paragraphs: [
      'We may update this Policy to reflect changes in technology, law, or our Services. Changes take effect when posted on the Site unless stated otherwise. Continued use of the Services after updates constitutes acceptance of the revised Policy.',
      'We may notify you of material changes by email or a notice on the Site. Please review this Policy periodically.'
    ]
  },
  {
    id: 'data-deletion',
    title: '12. Data Deletion',
    paragraphs: [
      'You may request deletion of your account by contacting us through the details in the "Questions / Grievance Redressal" section below.',
      'Upon receiving a valid deletion request, we will process it within a reasonable period (typically up to 90 days). You may withdraw a deletion request before processing is complete where applicable.'
    ]
  },
  {
    id: 'data-retention',
    title: '13. Data Retention',
    paragraphs: [
      'After account deletion, we may retain certain information where required for legal, tax, or financial compliance, including order history and payment records needed to resolve disputes or meet regulatory obligations.'
    ]
  },
  {
    id: 'grievance',
    title: '14. Questions / Grievance Redressal',
    paragraphs: [
      `If you have a question or grievance about how we handle your Information, contact us:`,
      `Phone: ${businessPhoneDisplay}`,
      `Address: Al Meeran Town, Citizen Colony, Hyderabad, Sindh, Pakistan`,
      'We will review and respond to legitimate requests in a reasonable timeframe.'
    ]
  },
  {
    id: 'minors',
    title: '15. Minors',
    paragraphs: [
      'We do not knowingly sell products or offer services to individuals under 18, and we do not knowingly collect personal data from minors. By using the Site, you confirm that you are at least 18 years old and able to accept this Policy.',
      'If you allow a minor to use your account, you consent to processing of information needed to fulfil orders placed through that account and accept responsibility for their use.',
      'You are responsible for unauthorised use of your account. Take reasonable steps to keep login details secure.'
    ]
  }
];
