export function normalizeSearchText(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getSearchTerms(query) {
  const normalized = normalizeSearchText(query);
  return normalized ? normalized.split(' ') : [];
}

export function matchesAllTerms(normalizedText, terms) {
  return terms.every((term) => normalizedText.includes(term));
}
