const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === '23505') {
    // Unique constraint violation
    return error(res, 'Email already exists', 409);
  }

  if (err.statusCode) {
    return error(res, err.message, err.statusCode);
  }

  return error(res, 'Internal server error', 500);
};

module.exports = errorHandler;
