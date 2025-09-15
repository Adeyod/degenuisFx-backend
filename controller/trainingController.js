import Training from '../model/trainingModel.js';
import { AppError } from '../utils/app.error.js';
import catchErrors from '../utils/tryCatch.js';
import { createTrainingSchema } from '../utils/validation.js';

const createTraining = catchErrors(async (req, res) => {
  const { title, classModeArray } = req.body;

  const { error, value } = createTrainingSchema.validate(req.body);

  if (error) {
    throw new AppError(error.details[0].message, 400);
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
    throw new AppError('Unable to create training', 400);
  }
});

const updateTrainingFees = catchErrors(async (req, res) => {
  const { title, classModeArray } = req.body;

  const { error, value } = createTrainingSchema.validate(req.body);

  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const training = await Training.findOne({ title: value.title });

  if (!training) {
    throw new AppError('Training not found', 404);
  }

  for (const classMode of training.classModes) {
    const matchingClassMode = value.classModeArray.find(
      (m) => m.title === classMode.title
    );

    if (matchingClassMode) {
      classMode.fee = matchingClassMode.fee;
    }
  }

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
    throw new AppError('Unable to update training fee', 400);
  }
});

const getTrainingDoc = catchErrors(async (req, res) => {
  const training = await Training.find();

  if (!training || training.length === 0) {
    throw new AppError('Training not found', 404);
  }

  return res.status(200).json({
    message: 'Training fetched successfully.',
    success: true,
    status: 200,
    training: training[0],
  });
});

export { createTraining, updateTrainingFees, getTrainingDoc };
