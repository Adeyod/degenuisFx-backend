class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

class JoiError extends Error {
  constructor(message, statusCode = 400, type) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.name = 'JoiError';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

class JwtError extends Error {
  constructor(message, statusCode = 401, expiredAt) {
    super(message);
    this.statusCode = statusCode;
    this.expiredAt = expiredAt;
    this.name = 'JwtError';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError, JoiError, JwtError };
