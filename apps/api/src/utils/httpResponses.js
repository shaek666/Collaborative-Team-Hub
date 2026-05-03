export const sendError = (res, statusCode, error, details) => {
  const payload = { error };

  if (details !== undefined) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
