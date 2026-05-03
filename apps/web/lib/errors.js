export const getApiErrorMessage = (error, fallback) => {
  return error.response?.data?.error || error.response?.data?.message || fallback;
};
