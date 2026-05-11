import data from '../data/chatbotData.json';
import { logUnmatchedQuery } from './chatbotAnalytics';

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const v0 = new Array(n + 1);
  const v1 = new Array(n + 1);
  for (let i = 0; i <= n; i += 1) v0[i] = i;
  for (let i = 0; i < m; i += 1) {
    v1[0] = i + 1;
    for (let j = 0; j < n; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= n; j += 1) v0[j] = v1[j];
  }
  return v0[n];
}

function tokenBoundaryMatch(t, token) {
  if (!/^[a-z0-9]{2,12}$/i.test(token)) return t.includes(token);
  const escaped = token.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(t);
}

const fuzzyMatch = (text, pattern) => {
  const p = pattern.toLowerCase().trim();
  if (!p) return 0;

  const words = p.split(/\s+/).filter(Boolean);
  const singleShort = words.length === 1 && /^[a-z0-9]{2,12}$/.test(words[0]);

  if (singleShort) {
    if (tokenBoundaryMatch(text, words[0])) return 1.0;
  } else if (text.includes(p)) {
    return 1.0;
  }

  const matchedWords = words.filter((w) =>
    /^[a-z0-9]{2,6}$/i.test(w) ? tokenBoundaryMatch(text, w) : text.includes(w)
  );
  let ratio = words.length ? matchedWords.length / words.length : 0;

  for (const w of words) {
    if (w.length < 4) continue;
    const messageWords = text.split(/[\s,.;:!?'"()[\]/]+/).filter(Boolean);
    for (let mw of messageWords) {
      mw = mw.toLowerCase();
      if (mw.length < 4) continue;
      const maxDist = w.length <= 6 ? 1 : w.length <= 10 ? 2 : Math.floor(w.length * 0.25);
      if (levenshtein(mw, w) <= maxDist) {
        const bump = words.length === 1 ? 0.92 : 0.78;
        ratio = Math.max(ratio, bump);
      }
    }
  }

  if (p.length >= 5 && words.length === 1) {
    const tokens = text.match(/[a-z0-9]+/gi) || [];
    for (const raw of tokens) {
      const t = raw.toLowerCase();
      if (t.length >= 4) {
        const maxDist = Math.max(1, Math.floor(p.length * 0.22));
        if (levenshtein(t, p) <= maxDist) {
          ratio = Math.max(ratio, 0.9);
        }
      }
    }
  }

  return Math.min(1, ratio);
};

export const findBestIntent = (userMessage) => {
  const message = userMessage.toLowerCase().trim();

  let bestSmalltalk = null;
  let bestSmallScore = 0;
  for (const item of data.smalltalk) {
    for (const pattern of item.patterns) {
      const score = fuzzyMatch(message, pattern);
      if (score >= 0.8 && score > bestSmallScore) {
        bestSmallScore = score;
        bestSmalltalk = { type: 'smalltalk', data: item };
      }
    }
  }

  let bestIntent = null;
  let bestIntentScore = 0;
  for (const intent of data.intents) {
    for (const pattern of intent.patterns) {
      const score = fuzzyMatch(message, pattern.toLowerCase());
      if (score > 0 && score > bestIntentScore) {
        bestIntentScore = score;
        bestIntent = { type: 'intent', data: intent };
      }
    }
  }

  if (bestSmalltalk && bestSmallScore >= 0.8 && bestSmallScore + 0.02 >= bestIntentScore) {
    return { match: bestSmalltalk, confidence: bestSmallScore };
  }

  return { match: bestIntent, confidence: bestIntentScore };
};

/** Extra tokens from last matched intent — helps short follow-ups (“charges?”, “COD?”). */
const CONTEXT_BOOST = {
  delivery: 'delivery shipping dispatch courier days charges express',
  payment: 'payment pay cod card easypaisa jazzcash bank transfer',
  return_refund: 'return refund exchange replace wapsi policy'
};

export const getResponse = (userMessage, ctx = {}) => {
  const lastTag = ctx.lastTag;
  let { match, confidence } = findBestIntent(userMessage);

  if (lastTag && CONTEXT_BOOST[lastTag]) {
    const boosted = findBestIntent(`${userMessage} ${CONTEXT_BOOST[lastTag]}`);
    if (boosted.confidence > confidence) {
      match = boosted.match;
      confidence = boosted.confidence;
    }
  }

  if (!match || confidence < 0.3) {
    logUnmatchedQuery(String(userMessage || '').trim());
    const defaults = data.defaultResponses;
    return {
      text: defaults[Math.floor(Math.random() * defaults.length)],
      tag: null,
      confidence: 0,
      followups: []
    };
  }

  if (match.type === 'smalltalk') {
    let text = match.data.response;
    if (confidence < 0.5 && confidence >= 0.3) {
      text = `Mujhe yakin nahi, lekin shayad yeh madad kare:\n\n${text}`;
    }
    return { text, tag: 'smalltalk', confidence, followups: [] };
  }

  const responses = match.data.responses;
  let text = responses[Math.floor(Math.random() * responses.length)];
  if (confidence < 0.5 && confidence >= 0.3) {
    text = `Mujhe yakin nahi, lekin yeh try karein:\n\n${text}`;
  }

  return {
    text,
    tag: match.data.tag,
    confidence,
    followups: data.contextual_followups[match.data.tag] || []
  };
};

export const getQuickReplies = () => data.quickReplies;

/** @deprecated use getQuickReplies */
export const getSuggestions = getQuickReplies;
