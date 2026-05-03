export const errorHandler = (err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', err.message, err.stack, err.code);
  const prismaStatusCode = err.code === 'P2025' ? 404 : null;
  const statusCode = prismaStatusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const payload = {
    error: prismaStatusCode ? 'Resource not found' : statusCode === 500 ? 'Internal server error' : err.message,
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.details = {
      message: err.message,
      stack: err.stack,
      code: err.code,
    };
  }

  res.status(statusCode).json(payload);
};
