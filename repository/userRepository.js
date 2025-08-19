import Investor from '../model/investorModel.js';
import Student from '../model/studentModel.js';

const findUserById = async (userId) => {
  try {
    const userCollections = [
      {
        model: Investor,
        field: '_id',
      },
      {
        model: Student,
        field: '_id',
      },
    ];

    for (const { model, field } of userCollections) {
      const user = await model.findOne({ [field]: userId });
      if (user) {
        return user;
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error occurred while finding user: ${error.message}`);
    }
    throw new Error('Error occurred while finding user');
  }
};

export { findUserById };
