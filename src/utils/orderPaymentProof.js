/**
 * Resolve bank-transfer proof from order document (paymentProof + legacy notes).
 */
export function resolvePaymentProof(order) {
  const raw = order?.paymentProof;
  const p =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw
      : {};

  let transactionId = String(p.transactionId || '').trim();
  let imageUrl = String(p.imageUrl || '').trim();
  const imagePublicId = String(p.imagePublicId || '').trim();
  let submittedAt = p.submittedAt || null;
  let source = transactionId || imageUrl ? 'paymentProof' : null;

  const notes = String(order?.notes || '');
  if (!transactionId && notes) {
    const m = notes.match(/Transaction\s*ID\s*:\s*([A-Za-z0-9_-]+)/i);
    if (m?.[1]) {
      transactionId = m[1].trim();
      source = source || 'notes';
    }
  }

  if (!imageUrl && notes && /screenshot|payment proof/i.test(notes)) {
    source = source || 'notes';
  }

  return {
    transactionId,
    imageUrl,
    imagePublicId,
    submittedAt,
    hasProof: Boolean(transactionId || imageUrl),
    source
  };
}

export function isBankTransferOrder(order) {
  const id = order?.paymentResult?.id || '';
  return (
    id === 'bank_transfer' ||
    /easypaisa|bank transfer/i.test(String(order?.paymentMethod || ''))
  );
}
