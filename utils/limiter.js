import { rateLimit } from 'express-rate-limit';

const limiter = (num) =>
  rateLimit({
    windowMs: 1 * 60 * 60 * 1000, // 15 minutes
    limit: num, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
    handler: (req, res) => {
      res.json({
        message: 'Too many requests, please try again later.',
        status: 429,
        success: false,
      });
    },
  });

export { limiter };
