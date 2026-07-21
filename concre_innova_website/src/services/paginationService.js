export const DEFAULT_PAGINATION = {
  items: [],
  totalItems: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export function normalizePaginatedResponse(response, fallbackPageNumber, fallbackPageSize) {
  if (Array.isArray(response)) {
    return {
      items: response,
      totalItems: response.length,
      pageNumber: fallbackPageNumber,
      pageSize: fallbackPageSize,
      totalPages: response.length > 0 ? 1 : 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  const items = Array.isArray(response?.items) ? response.items : [];
  const pageSize = Number(response?.pageSize) || fallbackPageSize;
  const totalItems = Number(response?.totalItems) || 0;
  const totalPages = Number(response?.totalPages) || Math.ceil(totalItems / pageSize) || 0;

  return {
    items,
    totalItems,
    pageNumber: Number(response?.pageNumber) || fallbackPageNumber,
    pageSize,
    totalPages,
    hasPreviousPage: Boolean(response?.hasPreviousPage),
    hasNextPage: Boolean(response?.hasNextPage),
  };
}
