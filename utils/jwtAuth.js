import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const generateToken = async (res, user) => {
  try {
    const payload = {
      userId: user._id,
      email: user.email,
    };

    const payload2 = {
      userId: user._id,
      unique: uuidv4(),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '54000000s',
    });

    const frontToken = jwt.sign(payload2, process.env.JWT_SECRET, {
      expiresIn: '54000000s',
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      // sameSite: 'strict',
      maxAge: 15 * 60 * 60 * 1000,
      secure: false, // Include this if your app is served over HTTP
      //secure: true, // Include this if your app is served over HTTPS
    });

    return frontToken;
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
