import Training from '../model/trainingModel.js';

const getTrainingUsingPreferedClassMode = async (classMode) => {
  try {
    const findTrainingFee = await Training.find();
    if (findTrainingFee.length === 0) {
      throw new AppError('Training fee not found.', 404);
    }

    // console.log('findTrainingFee:', findTrainingFee);

    const actualClassMode = findTrainingFee[0].classModes.find(
      (c) => c.title === classMode
    );
    // console.log('actualClassMode:', actualClassMode);
    if (!actualClassMode) {
      throw new AppError(`Invalid ${classMode} class mode.`, 400);
    }

    const objToSend = {
      mode: actualClassMode,
      _id: findTrainingFee[0]._id,
    };

    console.log('objToSend:', objToSend);
    return objToSend;
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.message, error.statusCode);
    } else {
      console.log(error);
      throw new Error('Something happened.');
    }
  }
};

const getTrainingUsingTrainingIdAndTrainingFee = async (id, fee) => {
  try {
    const findTrainingFee = await Training.findById({ _id: id });

    // console.log('findTrainingFee:', findTrainingFee);

    if (!findTrainingFee) {
      throw new AppError('Training fee not found.', 404);
    }

    // console.log('findTrainingFee:', findTrainingFee);

    const actualClassMode = findTrainingFee.classModes.find(
      (c) => c.fee === fee
    );
    // console.log('actualClassMode:', actualClassMode);
    if (!actualClassMode) {
      throw new AppError(`Invalid training fee.`, 400);
    }

    const objToSend = {
      mode: actualClassMode,
      _id: findTrainingFee._id,
    };

    console.log('objToSend:', objToSend);
    return objToSend;
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.message, error.statusCode);
    } else {
      console.log(error);
      throw new Error('Something happened.');
    }
  }
};

export {
  getTrainingUsingPreferedClassMode,
  getTrainingUsingTrainingIdAndTrainingFee,
};
