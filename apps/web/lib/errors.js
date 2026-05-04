export const getApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
  console.log('Error object:', error);
  console.log('Resolved error message:', message);
  return message;
};
