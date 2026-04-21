import seedData from '../data/fakeReviews.pk.json';

function hashSeed(str) {
  // simple stable 32-bit hash
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng, min, maxInclusive) {
  return min + Math.floor(rng() * (maxInclusive - min + 1));
}

function randomRating(rng) {
  // 2..5 with variety (not always 4.5 avg)
  const r = Math.floor(rng() * 100) + 1;
  if (r <= 20) return 2;
  if (r <= 45) return 3;
  if (r <= 78) return 4;
  return 5;
}

function randomDateISO(rng) {
  const daysBack = randInt(rng, 0, 90);
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(randInt(rng, 9, 22), randInt(rng, 0, 59), 0, 0);
  return d.toISOString();
}

export function getFakeReviewsKey(product) {
  const id = product?._id || product?.slug || product?.productId || product?.name || '';
  return String(id);
}

export function buildFakeReviews(product, forcedCount = null) {
  const key = getFakeReviewsKey(product);
  const rng = mulberry32(hashSeed(key));

  const count = forcedCount == null ? randInt(rng, 0, 10) : Math.max(0, Math.min(10, forcedCount));
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const rating = randomRating(rng);
    const name = pick(rng, seedData.names);
    const city = pick(rng, seedData.cities);
    const base = pick(rng, seedData.templates[String(rating)] || seedData.templates['4']);
    const comment = `${base} (${city})`;
    out.push({
      id: `${key}-${i}`,
      name,
      location: city,
      rating,
      comment,
      createdAt: randomDateISO(rng),
      isVerifiedPurchase: rng() < 0.55
    });
  }

  const avg = out.length
    ? Math.round((out.reduce((s, r) => s + (Number(r.rating) || 0), 0) / out.length) * 10) / 10
    : 0;

  return {
    rating: out.length ? Math.min(5, Math.max(2, avg)) : 0,
    count: out.length,
    reviews: out
  };
}

