import Student from '../model/studentModel.js';
import { paymentModeEnum } from '../utils/enumModules.js';
import { payStackInitialized } from '../utils/paystack.js';
import { trainingPaymentSchema } from '../utils/validation.js';

const makePayment = async (req, res) => {
  try {
    const user = req.user;

    const {
      preferedClassMode,
      paymentMode,
      trainingFee,
      amountPaid,
      balance,
      nextPaymentDate,
    } = req.body;

    if (paymentMode === paymentModeEnum[1]) {
      if (nextPaymentDate) {
        return res.status(400).json({
          error: `nextPaymentDate is required.`,
          status: 400,
          success: false,
        });
      }
    }

    const requiredFields = {
      preferedClassMode,
      paymentMode,
      trainingFee,
      amountPaid,
    };

    const missingField = Object.entries(requiredFields).find(
      ([key, value]) => !value
    );

    if (missingField) {
      return res.json({
        error: `Please provide ${missingField[0].replace(
          '_',
          ' '
        )} to proceed.`,
        status: 400,
        success: false,
      });
    }

    const payload = {
      preferedClassMode,
      paymentMode,
      trainingFee,
      amountPaid,
      balance,
      nextPaymentDate,
    };

    const { error, value } = trainingPaymentSchema.validate(payload);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        success: false,
        status: 400,
      });
    }

    const userExist = await Student.findById(user.userId);

    if (!userExist) {
      return res.status(404).json({
        error: 'User not found',
        success: false,
        status: 404,
      });
    }

    const userPayload = {
      preferedClassMode: value.preferedClassMode,
      paymentMode: value.paymentMode,
      trainingFee: value.trainingFee,
      amountPaid: value.amountPaid,
      balance: value.balance,
      nextPaymentDate:
        paymentMode === paymentModeEnum[1] && value.nextPaymentDate,
      email: userExist.email,
      userId: userExist._id,
    };

    const result = await payStackInitialized(userPayload);

    if (!result) {
      return res.status(400).json({
        message: 'Unable to process payment.',
        success: false,
        status: 400,
      });
    }

    return res.json({
      message: 'Initialized payment successfully',
      data: result.response.data.data,
      success: true,
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

export { makePayment };
