const globalErrorHandler = (err, req, res, next) => {
  if (err.code === 'EAUTH') {
    // Handle authentication failure errors (EAUTH)
    return res.status(500).json({
      message: 'Authentication failed. Please check your email credentials.',
      success: false,
    });
  } else if (err.status === 429) {
    // Handle rate limit errors
    return res.status(429).json({
      message: 'Too many requests, please try again later.',
      success: false,
    });
  } else {
    // Handle other errors
    return res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      success: false,
    });
  }
};

module.exports = globalErrorHandler;

export default globalErrorHandler;