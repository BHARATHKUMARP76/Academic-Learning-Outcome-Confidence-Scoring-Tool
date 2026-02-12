const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID';
  }

  res.status(statusCode).json({ message });
};

module.exports = { errorHandler };
