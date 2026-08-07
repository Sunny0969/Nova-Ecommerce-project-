/** Detect FAQ block already present in AI HTML body. */
export function bodyHasFaqSection(html) {
  return /<h2[^>]*>[^<]*(?:faq|frequently asked)/i.test(String(html || ''));
}

/** Extract FAQ pairs from HTML for schema / accordion fallback. */
export function extractFaqItemsFromHtml(html) {
  const clean = String(html || '');
  const faqMatch = clean.match(
    /<h2[^>]*>[^<]*(?:faq|frequently asked)[^<]*<\/h2>([\s\S]*?)(?=<h2|$)/i
  );
  if (!faqMatch) return [];

  const block = faqMatch[1];
  const items = [];
  const h3Parts = block.split(/<h3[^>]*>/i).slice(1);

  for (const chunk of h3Parts) {
    const end = chunk.indexOf('</h3>');
    if (end === -1) continue;
    const question = chunk
      .slice(0, end)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const answer = chunk
      .slice(end + 5)
      .replace(/<h3[\s\S]*$/i, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (question && answer) items.push({ question, answer });
  }

  return items.slice(0, 8);
}
