import Investor from '../model/investorModel.js';
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

// const permission = async (req, res, next) => {
//   try {
//     const user = req.user.userId;

//     const findUser = await Student.findById({ _id: user });

//     if (findUser === null) {
//       res.json({
//         message: 'Unauthorized',
//         status: 403,
//         success: false,
//       });
//     } else if (findUser.role !== 'admin') {
//       res.json({
//         message: 'Unauthorized',
//         status: 403,
//         success: false,
//       });
//     } else {
//       next();
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

const permission = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('User not authenticated.', 401));
      }

      const roleModels = {
        investor: Investor,
        student: Student,
      };

      const userId = req.user?.userId;
      const userRole = req.user.userRole;
      console.log('userRole:', userRole);

      const model = roleModels[userRole];

      if (!model) {
        throw new Error('Invalid role');
      }

      const user = await model.findOne({
        _id: userId,
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const hasRole = requiredRoles.includes(user.role);

      if (!hasRole) {
        return next(
          new AppError('You are not authorized to view this resource.', 403)
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export { permission };
