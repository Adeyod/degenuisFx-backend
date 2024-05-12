import Student from '../model/studentModel.js';

// const permission = (requiredRoles) => {
//   return async (req, res, next) => {
//     try {
//       const user = req.user.userId;
//       const findUser = await Student.findById({ _id: user });

//       if (findUser.role === 'admin') {
//         next();
//       } else {
//         res.json({
//           message: 'Unauthorized',
//           status: 403,
//           success: false,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };
// };

const permission = async (req, res, next) => {
  try {
    const user = req.user.userId;

    const findUser = await Student.findById({ _id: user });

    if (findUser === null) {
      res.json({
        message: 'Unauthorized',
        status: 403,
        success: false,
      });
    } else if (findUser.role !== 'admin') {
      res.json({
        message: 'Unauthorized',
        status: 403,
        success: false,
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
};

export { permission };
