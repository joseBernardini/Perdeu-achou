import { buildSearchIndex } from './objectFilters';
import { getSearchTerms, matchesAllTerms, normalizeSearchText } from './searchText';

export function filterAdminObjects(objects, { query = '', status = '', category = '' } = {}) {
  const terms = getSearchTerms(query);

  return objects.filter((object) => {
    if (status && object.status !== status) return false;
    if (category && object.category !== category) return false;
    return terms.length === 0 || matchesAllTerms(buildSearchIndex(object), terms);
  });
}

export function filterAdminRequests(requests, { query = '', status = '' } = {}) {
  const terms = getSearchTerms(query);

  return requests.filter((request) => {
    if (status && request.status !== status) return false;
    if (terms.length === 0) return true;

    const text = normalizeSearchText(
      [request.id, request.objectId, request.object?.name, request.requesterId, request.requester?.name].join(' ')
    );
    return matchesAllTerms(text, terms);
  });
}
