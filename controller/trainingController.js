import Training from '../model/trainingModel.js';
import { createTrainingSchema } from '../utils/validation.js';

const createTraining = async (req, res) => {
  try {
    const { title, classModeArray } = req.body;

    const { error, value } = createTrainingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        success: false,
        status: 400,
      });
    }
    const newTraining = new Training({
      title: title,
      classModes: classModeArray,
    });

    await newTraining.save();

    if (newTraining) {
      return res.status(201).json({
        message: 'Training created successfully',
        success: true,
        status: 201,
      });
    } else {
      return res.status(400).json({
        message: 'Unable to create training',
        success: false,
        status: 400,
      });
    }
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

const updateTrainingFees = async (req, res) => {
  try {
    const { title, classModeArray } = req.body;

    const { error, value } = createTrainingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        success: false,
        status: 400,
      });
    }

    const training = await Training.findOne({ title: value.title });

    if (!training) {
      return res.status(404).json({
        message: 'Training not found',
        success: false,
        status: 404,
      });
    }

    for (const classMode of training.classModes) {
      const matchingClassMode = value.classModeArray.find(
        (m) => m.title === classMode.title
      );

      if (matchingClassMode) {
        console.log('matchingClassMode:', matchingClassMode);
        classMode.fee = matchingClassMode.fee;
        console.log('classMode.fee:', classMode.fee);
      }
    }

    console.log('training.classMode:', training.classMode);
    training.markModified('classModes');
    const updatedTraining = await training.save();

    if (updatedTraining) {
      return res.status(200).json({
        message: 'Training fee updated successfully.',
        success: true,
        status: 200,
        updatedTraining,
      });
    } else {
      return res.status(400).json({
        message: 'Unable to update training fee',
        success: false,
        status: 400,
      });
    }
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

const getTrainingDoc = async (req, res) => {
  try {
    const training = await Training.find();

    if (!training || training.length === 0) {
      return res.status(404).json({
        message: 'Training not found',
        success: false,
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Training fetched successfully.',
      success: true,
      status: 200,
      training: training[0],
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

export { createTraining, updateTrainingFees, getTrainingDoc };
