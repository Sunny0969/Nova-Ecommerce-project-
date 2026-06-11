/**
 * FAQ content — Bazaar online grocery store.
 */
import { businessDisplayName, businessPhoneDisplay } from '../utils/businessContact';

export const FAQ_META = {
  title: 'Frequently Asked Questions',
  subtitle: 'Your guide to fast, reliable, and affordable grocery shopping with Bazaar'
};

export const FAQ_CATEGORIES = [
  {
    id: 'about',
    title: 'About Bazaar',
    items: [
      {
        q: `What is ${businessDisplayName}?`,
        a: `${businessDisplayName} is an online grocery and essentials store in Pakistan. Browse products on our website, place an order, and get delivery to your doorstep — without visiting crowded markets.`
      },
      {
        q: 'How does shopping on Bazaar work?',
        a: 'Create an account or checkout as a guest, add items to your cart, enter your delivery address, choose a delivery option, and pay securely. You receive order updates as we prepare and dispatch your order.'
      },
      {
        q: 'How quickly are orders delivered?',
        a: 'Delivery times depend on your location and the option you select at checkout. Standard and express options are shown with estimated fees before you pay. Many areas receive next-day delivery where available.'
      },
      {
        q: 'What products can I buy?',
        a: 'We stock groceries, beverages, personal care, baby care, pet care, cleaning supplies, and household essentials across 30+ categories — with 1,000+ products and growing.'
      },
      {
        q: 'Where do you deliver?',
        a: 'We deliver across Pakistan from our base in Hyderabad, Sindh. Enter your address at checkout to see available delivery options and charges for your area.'
      },
      {
        q: 'Why shop with Bazaar?',
        a: 'Competitive everyday prices, a wide range in one place, secure checkout, and reliable delivery — designed to save you time on routine shopping.'
      }
    ]
  },
  {
    id: 'quality',
    title: 'Products & Quality',
    items: [
      {
        q: 'Are products fresh and genuine?',
        a: 'We source from trusted suppliers and check items before dispatch. Perishable goods are packed with care. If something does not meet your expectations, contact us promptly.'
      },
      {
        q: 'How are fruits, vegetables, and meat handled?',
        a: 'Fresh categories are picked and packed close to dispatch time where possible. Temperature-sensitive items are handled according to product type and local delivery conditions.'
      },
      {
        q: 'Can I see product details before ordering?',
        a: 'Yes. Each product page shows description, price, weight or size, and images where available. Review your cart before checkout.'
      }
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Payments',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Browse the shop, add items to your cart, go to checkout, enter delivery details, select shipping, and complete payment. You will receive an order confirmation on screen and by email when provided.'
      },
      {
        q: 'Which payment methods are accepted?',
        a: 'We support secure card payments through our payment partners. Available methods are shown at checkout for your order.'
      },
      {
        q: 'Is my payment information safe?',
        a: 'Checkout uses encrypted connections. Card details are processed by our payment provider — we do not store full card numbers on our servers.'
      },
      {
        q: 'Where can I view my orders?',
        a: 'Sign in and open My Orders in your account to see current and past orders, statuses, and details.'
      },
      {
        q: 'Is there a minimum order amount?',
        a: 'Minimum order rules, if any, are shown at checkout before you pay. Delivery fees may also depend on order value and weight.'
      },
      {
        q: 'Do I need an account to order?',
        a: 'You can shop with an account for easier reordering and order history. Guest checkout may be available depending on current site settings.'
      },
      {
        q: 'Can I change my order after placing it?',
        a: 'Contact us as soon as possible if you need to add or remove items. Once picking or dispatch has started, changes may not be possible.'
      }
    ]
  },
  {
    id: 'delivery',
    title: 'Delivery',
    items: [
      {
        q: 'When will my order arrive?',
        a: 'Estimated delivery depends on the option you choose at checkout and your location. Order confirmation and account order pages show the latest status.'
      },
      {
        q: 'Is there a delivery fee?',
        a: 'Yes. Standard delivery may be calculated by cart weight; express and next-day options use fixed rates shown at checkout. Free delivery may apply above a minimum subtotal for standard delivery only.'
      },
      {
        q: 'Can I change my delivery address after ordering?',
        a: 'Reach out immediately if the address was entered incorrectly. We will try to update it before dispatch; changes may not be possible once the order is out for delivery.'
      },
      {
        q: 'Do I need to be home for delivery?',
        a: 'Someone should be available to receive the order unless you have arranged a safe drop-off note with our team in advance.'
      },
      {
        q: 'What if my order is delayed?',
        a: 'Delays can happen due to weather, traffic, or high demand. Check your order status in your account or contact us with your order number for an update.'
      }
    ]
  },
  {
    id: 'returns',
    title: 'Cancellations & Returns',
    items: [
      {
        q: 'How do I cancel an order?',
        a: 'Contact customer support with your order number as soon as possible. Orders already picked or dispatched may not be cancellable.'
      },
      {
        q: 'Can I return an item?',
        a: 'Unopened non-perishable items in original condition may be eligible for return within a limited window. Perishable and opened goods are generally not returnable unless faulty or incorrect.'
      },
      {
        q: 'What if I receive the wrong or damaged item?',
        a: 'Report it within 24 hours of delivery with your order number and, if possible, a photo. We will review and offer a replacement or refund where appropriate.'
      },
      {
        q: 'What if something is missing from my order?',
        a: 'Check your receipt and packaging first, then contact us with your order number. We will verify with our packing team and resolve missing items promptly.'
      }
    ]
  },
  {
    id: 'location',
    title: 'Location & Address',
    items: [
      {
        q: 'How do I set my delivery location?',
        a: 'Enter your full address at checkout, including city, province, and a valid 5-digit postcode. Use the province and city dropdowns for accurate delivery routing.'
      },
      {
        q: 'Can the rider deliver to a different address?',
        a: 'Delivery is made to the address confirmed at checkout. Last-minute address changes must be approved by support before dispatch.'
      },
      {
        q: 'My location is not recognised — what should I do?',
        a: 'Double-check province, city, and postcode. If your area is new on our system, contact us — we are expanding delivery coverage over time.'
      }
    ]
  },
  {
    id: 'refunds',
    title: 'Refunds & Exchanges',
    items: [
      {
        q: 'How do I request a refund?',
        a: 'Contact support with your order number and reason. Approved refunds are returned to the original payment method where possible; timing depends on your bank or card provider.'
      },
      {
        q: 'How long do refunds take?',
        a: 'Once approved, refunds typically appear within 5–10 business days depending on your payment provider.'
      },
      {
        q: 'Can I exchange a product?',
        a: 'Exchanges may be offered for eligible non-perishable items. Support will guide you based on stock and the nature of the issue.'
      }
    ]
  },
  {
    id: 'support',
    title: 'Help & Support',
    items: [
      {
        q: 'Are there any hidden fees?',
        a: 'Product prices, shipping, and applicable taxes or charges are shown at checkout before you confirm payment. There are no surprise fees after you place an order.'
      },
      {
        q: 'How do I contact Bazaar?',
        a: `Visit our Contact Us page or call ${businessPhoneDisplay} for order help, delivery questions, or feedback.`
      },
      {
        q: 'Need more help?',
        a: 'Our team aims to respond as quickly as possible. Include your order number and a clear description of the issue so we can assist you faster.'
      }
    ]
  }
];
