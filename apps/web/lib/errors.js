export const getApiErrorMessage = (error, fallback) => {
  // Axios error response: error.response.data contains the backend response
  const data = error?.response?.data;
  if (data) {
    // Backend sendError format: { error: 'message' }
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (data.details) return data.details;
  }
  return error?.message || fallback;
};
