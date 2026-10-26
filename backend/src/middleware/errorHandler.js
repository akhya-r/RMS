const ApiError = require("../utils/apiError").default;

const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message = "Internal Server Error" } = err;
  res.status(statusCode).json({ message });
};

module.exports = errorHandler;