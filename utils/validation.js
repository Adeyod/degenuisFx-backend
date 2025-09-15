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

export { paymentSchema, createTrainingSchema, createInvestmentSchema };
