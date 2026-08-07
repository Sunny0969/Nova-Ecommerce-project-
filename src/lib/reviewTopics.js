export const REVIEW_TOPICS = [
  { value: 'quality', label: 'Product quality' },
  { value: 'value', label: 'Value for money' },
  { value: 'packaging', label: 'Packaging & delivery' },
  { value: 'as_described', label: 'Matches description' },
  { value: 'size_fit', label: 'Size / fit' },
  { value: 'customer_service', label: 'Customer service' }
];

export function reviewTopicLabel(value) {
  const topic = String(value || '').trim().toLowerCase();
  return REVIEW_TOPICS.find((t) => t.value === topic)?.label || '';
}
