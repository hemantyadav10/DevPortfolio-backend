function errorHandler(err, _req, res, _next) {
  console.log(err);

  const statusCode = err.statusCode || 500;
  const data = err.data || null;
  const message = err.message || "Something went wrong";
  const errors = err.errors || [];
  const stack = process.env.NODE_ENV === "development" ? err.stack : {};
  const success = false;

  const response = {
    statusCode,
    data,
    message,
    errors,
    stack,
    success,
  }

  return res
    .status(statusCode)
    .json(response);
}

export default errorHandler;