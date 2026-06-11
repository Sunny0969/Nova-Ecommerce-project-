const COD_OPTION = {
  id: 'cod',
  label: 'Cash on delivery',
  description: 'Pay with cash when your order arrives at your doorstep.'
};

const STRIPE_OPTION = {
  id: 'stripe',
  label: 'Credit / debit card (Stripe)',
  description: 'Pay securely online with Visa, Mastercard, or other supported cards.'
};

/** Legacy Easypaisa number — shown only for older bank-transfer orders. */
export const EASYPAISA_NUMBER = '03483510584';

/** @param {{ includeStripe?: boolean }} [opts] */
export function getPaymentOptions(opts = {}) {
  const options = [COD_OPTION];
  if (opts.includeStripe) {
    options.push(STRIPE_OPTION);
  }
  return options;
}

/** @deprecated use getPaymentOptions() */
export const PAYMENT_OPTIONS = [COD_OPTION];
