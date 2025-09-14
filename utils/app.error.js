class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
    this.name = 'AppError';
  }
}

class JoiError extends Error {
  constructor(message, statusCode = 400, type) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    Object.setPrototypeOf(this, JoiError.prototype);
    this.name = 'JoiError';
  }
}

class JwtError extends Error {
  constructor(message, statusCode, expiredAt) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.expiredAt = expiredAt;
    console.log('jwt expired:', expiredAt);
    Object.setPrototypeOf(this, JwtError.prototype);
    this.name = 'JwtError';
  }
}

export { AppError, JoiError, JwtError };
