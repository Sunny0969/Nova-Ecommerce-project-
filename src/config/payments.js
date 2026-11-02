const COD_OPTION = {
  id: 'cod',
  label: 'Cash on delivery',
  description: 'Pay with cash when your order arrives at your doorstep.'
};

const BANK_TRANSFER_OPTION = {
  id: 'bank_transfer',
  label: 'Account Payment',
  description: 'Easypaisa: 03483510584 (Sanil Parkash) | Jazzcash: 03483510584 (Sanil Parkash)'
};

export const EASYPAISA_NUMBER = '03483510584';

export function getPaymentOptions() {
  return [BANK_TRANSFER_OPTION, COD_OPTION];
}

export const PAYMENT_OPTIONS = [BANK_TRANSFER_OPTION, COD_OPTION];
