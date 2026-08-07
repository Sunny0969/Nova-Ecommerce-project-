export function lineProductId(line) {
  const p = line?.product;
  if (p == null) return '';
  if (typeof p === 'object' && p._id) return String(p._id);
  return String(p);
}

/** Map productId → review doc from GET /api/auth/reviews */
export function mapUserReviewsByProduct(reviews) {
  const map = new Map();
  (reviews || []).forEach((r) => {
    const pid =
      typeof r.product === 'object' && r.product?._id != null
        ? String(r.product._id)
        : r.product != null
          ? String(r.product)
          : '';
    if (pid) map.set(pid, r);
  });
  return map;
}

/** Merge API itemReviews + user's review list for accurate per-product status. */
export function buildReviewMetaMap(order, itemReviews, userReviewsByProduct) {
  const map = new Map();
  (itemReviews || []).forEach((row) => {
    if (row?.productId) map.set(String(row.productId), { ...row });
  });

  const lines = order?.orderItems || [];
  const productIds = [...new Set(lines.map(lineProductId).filter(Boolean))];

  productIds.forEach((pid) => {
    const fromApi = map.get(pid);
    const fromUser = userReviewsByProduct.get(pid);

    if (fromUser || fromApi?.hasReview) {
      map.set(pid, {
        productId: pid,
        productName: fromApi?.productName || fromUser?.product?.name || '',
        hasReview: true,
        canReview: false,
        reviewId: fromApi?.reviewId || (fromUser?._id ? String(fromUser._id) : null),
        rating:
          fromApi?.rating != null
            ? Number(fromApi.rating)
            : fromUser?.rating != null
              ? Number(fromUser.rating)
              : null,
        topic: fromApi?.topic || fromUser?.topic || '',
        comment: fromApi?.comment || fromUser?.comment || '',
        images: fromApi?.images || fromUser?.images || []
      });
      return;
    }

    if (fromApi) {
      map.set(pid, fromApi);
      return;
    }

    map.set(pid, {
      productId: pid,
      hasReview: false,
      canReview: true
    });
  });

  return map;
}

export function orderPendingReviewProductIds(order, reviewedProductIds) {
  if (order?.status !== 'delivered') return [];
  const lines = order.orderItems || [];
  const ids = [...new Set(lines.map(lineProductId).filter(Boolean))];
  return ids.filter((id) => !reviewedProductIds.has(String(id)));
}

export function orderIsFullyReviewed(order, reviewedProductIds) {
  if (order?.status !== 'delivered') return false;
  const lines = order.orderItems || [];
  const ids = [...new Set(lines.map(lineProductId).filter(Boolean))];
  return ids.length > 0 && ids.every((id) => reviewedProductIds.has(String(id)));
}
