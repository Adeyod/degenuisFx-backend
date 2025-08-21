import Training from '../model/trainingModel.js';

const getTrainingUsingPreferedClassMode = async (classMode) => {
  try {
    const findTrainingFee = await Training.find();
    if (findTrainingFee.length === 0) {
      throw new Error('Training fee not found.', 404);
    }

    // console.log('findTrainingFee:', findTrainingFee);

    const actualClassMode = findTrainingFee[0].classModes.find(
      (c) => c.title === classMode
    );
    // console.log('actualClassMode:', actualClassMode);
    if (!actualClassMode) {
      throw new Error(`Invalid ${classMode} class mode.`, 400);
    }

    const objToSend = {
      mode: actualClassMode,
      _id: findTrainingFee[0]._id,
    };

    console.log('objToSend:', objToSend);
    return objToSend;
  } catch (error) {
    throw new Error('Unable to get training fee.', 500);
  }
};

export { getTrainingUsingPreferedClassMode };
