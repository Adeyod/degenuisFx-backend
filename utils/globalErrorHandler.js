// const globalErrorHandler = (err, req, res, next) => {
//   if (err.code === 'EAUTH' || err.responseCode === 535) {
//     // Handle authentication failure errors (EAUTH)
//     return res.status(500).json({
//       message: 'Authentication failed. Please check your email credentials.',
//       success: false,
//       status: 500,
//     });
//   } else if (err.status === 429) {
//     // Handle rate limit errors
//     return res.status(429).json({
//       message: 'Too many requests, please try again later.',
//       success: false,
//       status: 429,
//     });
//   } else {
//     // Handle other errors
//     return res.status(err.status || 500).json({
//       message: err.message || 'Internal Server Error',
//       status: err.status || 500,
//       success: false,
//     });
//   }
// };

const globalErrorHandler = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('uncaughtRejection', (reason, promise) => {
    console.error('Uncaught Rejection:', reason);
  });
};

export default globalErrorHandler;
