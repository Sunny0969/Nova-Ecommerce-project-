import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import StarRating from './StarRating';
import { productsAPI } from '../api/storefront';
import { apiMessage } from '../lib/api';
import { REVIEW_TOPICS } from '../lib/reviewTopics';

const MAX_IMAGES = 5;

export default function ProductReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  reviewId = null,
  mode = 'create',
  initialRating = 5,
  initialTopic = '',
  initialComment = '',
  existingImages = [],
  onSuccess
}) {
  const isEdit = mode === 'edit' && reviewId;
  const [rating, setRating] = useState(5);
  const [topic, setTopic] = useState('');
  const [comment, setComment] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setRating(Number(initialRating) || 5);
    setTopic(initialTopic || '');
    setComment(initialComment || '');
    setImageFiles([]);
    setPreviews([]);
  }, [isOpen, productId, reviewId, initialRating, initialTopic, initialComment]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const savedImageCount = Array.isArray(existingImages) ? existingImages.length : 0;
  const totalImages = savedImageCount + imageFiles.length;

  const addImages = (fileList) => {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    const room = MAX_IMAGES - totalImages;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} photos`);
      return;
    }

    const next = incoming.slice(0, room);
    setImageFiles((prev) => [...prev, ...next]);
    setPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!productId) return;
    if (!rating || rating < 1) {
      toast.error('Please select a star rating');
      return;
    }
    if (!topic) {
      toast.error('Please choose an option from the dropdown');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write your review');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        rating: Math.round(Number(rating)),
        topic,
        comment: comment.trim()
      };

      let savedReviewId = reviewId;

      if (isEdit) {
        await productsAPI.updateReview(productId, reviewId, body);
      } else {
        const res = await productsAPI.addReview(productId, body);
        savedReviewId = res.data?.data?._id || res.data?._id || null;
      }

      if (imageFiles.length && savedReviewId) {
        try {
          await productsAPI.appendReviewImages(productId, savedReviewId, imageFiles);
        } catch (imgErr) {
          toast.error(
            apiMessage(imgErr, 'Review saved, but photos could not be uploaded. Try editing the review.')
          );
          onSuccess?.();
          onClose?.();
          return;
        }
      }

      toast.success(isEdit ? 'Review updated' : 'Thank you — your review was posted');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onClose?.()}
      title={isEdit ? 'Edit your review' : 'Write a review'}
      confirmLabel={submitting ? 'Saving…' : isEdit ? 'Save review' : 'Submit review'}
      onConfirm={() => {
        if (!submitting) handleSubmit();
      }}
      className="max-w-lg"
    >
      <div className="product-review-modal">
        <div className="product-review-modal__product">
          {productImage ? (
            <img
              src={productImage}
              alt=""
              className="product-review-modal__product-img"
              width={56}
              height={56}
            />
          ) : null}
          <p className="product-review-modal__product-name">{productName || 'Product'}</p>
        </div>

        <label className="account-form__label">Your rating</label>
        <StarRating mode="interactive" value={rating} onChange={setRating} disabled={submitting} />

        <label className="account-form__label" htmlFor="review-modal-topic">
          What are you reviewing?
        </label>
        <select
          id="review-modal-topic"
          className="account-form__input product-review-modal__select"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={submitting}
          required
        >
          <option value="">Select an option</option>
          {REVIEW_TOPICS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="account-form__label" htmlFor="review-modal-comment">
          Your review
        </label>
        <textarea
          id="review-modal-comment"
          className="account-form__input account-form__textarea product-review-modal__comment"
          rows={4}
          placeholder="Tell others about quality, fit, packaging, or your experience…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          disabled={submitting}
          required
        />

        <div className="product-review-modal__photos">
          <div className="product-review-modal__photos-head">
            <label className="account-form__label">Photos (optional)</label>
            <span className="product-review-modal__photos-count">
              {totalImages}/{MAX_IMAGES}
            </span>
          </div>
          <div className="product-review-modal__photos-grid">
            {Array.isArray(existingImages) &&
              existingImages.map((img, i) =>
                img?.url ? (
                  <div key={`saved-${i}`} className="product-review-modal__photo">
                    <img src={img.url} alt="" className="product-review-modal__photo-img" />
                  </div>
                ) : null
              )}
            {previews.map((src, i) => (
              <div key={src} className="product-review-modal__photo">
                <img src={src} alt="" className="product-review-modal__photo-img" />
                <button
                  type="button"
                  className="product-review-modal__photo-remove"
                  aria-label="Remove photo"
                  onClick={() => removeNewImage(i)}
                  disabled={submitting}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ))}
            {totalImages < MAX_IMAGES ? (
              <button
                type="button"
                className="product-review-modal__photo-add"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <ImagePlus size={22} aria-hidden />
                <span>Add photo</span>
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="visually-hidden"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = '';
            }}
          />
          <p className="product-review-modal__hint">Add up to {MAX_IMAGES} photos (JPG, PNG, WebP).</p>
        </div>
      </div>
    </Modal>
  );
}
