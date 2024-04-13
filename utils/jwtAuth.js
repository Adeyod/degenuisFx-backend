import jwt from 'jsonwebtoken';

const generateToken = async (res, user) => {
  try {
    const payload = {
      userId: user._id,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1800s',
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 60 * 1000,
    });

    return token;
  } catch (error) {
    console.log(error.message);
    return;
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json({
        message: 'Please login to continue',
        status: 403,
        success: false,
      });
    }

    await jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.json({
          message: 'Invalid token',
          success: false,
          status: 401,
          error: err.message,
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.log(error.message);
    return;
  }
};

export { generateToken, verifyToken };
