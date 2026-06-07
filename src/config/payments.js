/** Manual checkout payment options (Stripe disabled). */
export const EASYPAISA_NUMBER = '03483510584';

export const PAYMENT_OPTIONS = [
  {
    id: 'cod',
    label: 'Cash on delivery',
    description: 'Pay with cash when your order arrives at your doorstep.'
  },
  {
    id: 'bank_transfer',
    label: 'Bank transfer (Easypaisa)',
    description: `Send the order total via Easypaisa to ${EASYPAISA_NUMBER}. We will confirm after payment.`
  }
];
