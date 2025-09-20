import Joi from 'joi';
import {
  allowedInvestmentDurationEnum,
  paymentModeEnum,
  preferedClassModeEnum,
} from './enumModules.js';

const paymentSchema = Joi.object({
  preferedClassMode: Joi.string()
    .valid(...preferedClassModeEnum)
    .required()
    .messages({
      'any.only': '{{#label}} must be one of {{#valids}}',
      'string.empty': '{{#label}} is required',
    }),
  paymentMode: Joi.string()
    .valid(...paymentModeEnum)
    .required()
    .messages({
      'any.only': '{{#label}} must be one of {{#label}}',
      'string.empty': '{{#label}} is required',
    }),

  trainingFee: Joi.number().required(),
  amountPaid: Joi.number(),
  balance: Joi.number().optional(),
  nextPaymentDate: Joi.date().optional(),
});

const createTrainingSchema = Joi.object({
  title: Joi.string(),
  classModeArray: Joi.array().items(
    Joi.object({
      title: Joi.string()
        .valid(...preferedClassModeEnum)
        .required(),
      fee: Joi.number().required(),
    })
  ),
});

const createInvestmentSchema = Joi.object({
  amountToInvest: Joi.number().required(),
  investmentDuration: Joi.string()
    .valid(...allowedInvestmentDurationEnum)
    .required(),
  adminChargeFee: Joi.number().required(),
  adminChargePercent: Joi.number().valid(3, 5).required(),
});

const registerSchemaValidation = Joi.object({
  firstName: Joi.string()
    .trim()
    .pattern(/^[A-Za-z\s]+$/)
    .required(),
  lastName: Joi.string()
    .trim()
    .pattern(/^[A-Za-z\s]+$/)
    .required(),
  middleName: Joi.string().trim().allow(''),
  email: Joi.string().trim().email().required(),
  password: Joi.string()
    .min(8)
    .max(20)
    .pattern(/[a-z]/) // at least 1 lowercase
    .pattern(/[A-Z]/) // at least 1 uppercase
    .pattern(/[0-9]/) // at least 1 number
    .pattern(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/) // at least 1 special char
    .required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password and confirm password do not match',
  }),
  phoneNumber: Joi.string().required(),
  address: Joi.string().trim().required(),
  countryOfResidence: Joi.string().trim().required(),
  stateOfResidence: Joi.string().trim().required(),
  gender: Joi.string().valid('male', 'female', 'others').required(),
  DOB: Joi.date().required(),
  coordinates: Joi.object({
    long: Joi.number().required(),
    lat: Joi.number().required(),
    placeId: Joi.string().required(),
  }).required(),
  role: Joi.string().required(),
});

export {
  registerSchemaValidation,
  paymentSchema,
  createTrainingSchema,
  createInvestmentSchema,
};
