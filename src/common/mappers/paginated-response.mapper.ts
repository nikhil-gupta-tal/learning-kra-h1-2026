export function toPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
