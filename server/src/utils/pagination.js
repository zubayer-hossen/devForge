export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function parseSort(sortParam, allowed, fallback = '-createdAt') {
  if (!sortParam || typeof sortParam !== 'string') return fallback;
  const field = sortParam.replace(/^-/, '');
  return allowed.includes(field) ? sortParam : fallback;
}

export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function paginate(Model, filter, { page, limit, skip }, { sort = '-createdAt', populate, select } = {}) {
  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) q = q.select(select);
  if (populate) q = q.populate(populate);
  const [items, total] = await Promise.all([q.lean(), Model.countDocuments(filter)]);
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}
