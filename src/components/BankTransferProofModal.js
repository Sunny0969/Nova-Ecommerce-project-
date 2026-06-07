import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPKR } from '../utils/currency';
import { EASYPAISA_NUMBER } from '../config/payments';

/**
 * Collect Easypaisa transaction ID and/or payment screenshot before placing order.
 */
export default function BankTransferProofModal({
  isOpen,
  onClose,
  orderTotal,
  onSubmit,
  submitting = false
}) {
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setTransactionId('');
      setFile(null);
      setPreview(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG or PNG)');
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      toast.error('Image must be 3MB or smaller');
      return;
    }
    setFile(f);
  };

  const handleSubmit = () => {
    const tid = transactionId.trim();
    if (!tid && !file) {
      toast.error('Enter transaction ID or upload a payment screenshot');
      return;
    }
    onSubmit({ transactionId: tid, file });
  };

  const canSubmit = (transactionId.trim().length > 0 || file) && !submitting;

  return createPortal(
    <div className="bank-proof-modal" role="presentation">
      <button
        type="button"
        className="bank-proof-modal__backdrop"
        aria-label="Close"
        onClick={submitting ? undefined : onClose}
      />
      <div
        className="bank-proof-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-proof-title"
      >
        <div className="bank-proof-modal__head">
          <h2 id="bank-proof-title" className="bank-proof-modal__title">
            Payment proof (Easypaisa)
          </h2>
          <button
            type="button"
            className="bank-proof-modal__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="bank-proof-modal__body">
          <p className="bank-proof-modal__lead">
            Send <strong>{formatPKR(orderTotal)}</strong> to Easypaisa{' '}
            <strong>{EASYPAISA_NUMBER}</strong>, then share your transaction ID or upload a
            screenshot so we can verify your payment.
          </p>

          <label className="form-label" htmlFor="bank-txn-id">
            Transaction ID
          </label>
          <input
            id="bank-txn-id"
            className="form-control"
            placeholder="e.g. 12345678901"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            maxLength={120}
            disabled={submitting}
            autoComplete="off"
          />

          <p className="bank-proof-modal__or">or</p>

          <label className="bank-proof-modal__upload">
            <input
              type="file"
              accept="image/*"
              className="bank-proof-modal__file-input"
              onChange={handleFileChange}
              disabled={submitting}
            />
            <Upload size={20} aria-hidden />
            <span>{file ? file.name : 'Upload payment screenshot (JPG/PNG, max 3MB)'}</span>
          </label>

          {preview ? (
            <div className="bank-proof-modal__preview">
              <img src={preview} alt="Payment screenshot preview" />
            </div>
          ) : (
            <p className="bank-proof-modal__hint">
              <ImageIcon size={14} aria-hidden /> At least one of transaction ID or screenshot is
              required.
            </p>
          )}
        </div>

        <div className="bank-proof-modal__foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-gold"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? 'Placing order…' : 'Submit & place order'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
