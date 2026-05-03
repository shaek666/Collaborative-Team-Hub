export const addPendingId = (pendingIds, id) => new Set(pendingIds).add(id);

export const removePendingId = (pendingIds, id) => {
  const nextPendingIds = new Set(pendingIds);
  nextPendingIds.delete(id);
  return nextPendingIds;
};
