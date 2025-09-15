import axios from 'axios';
import {
  findPaymentTransactionByReferenceAndUpdateStatus,
  saveInitializedPayment,
  saveInitializedBalance,
  updatePaymentInitializationWithPaystackData,
  saveInitializedInvestmentPayment,
} from '../repository/paymentRepository.js';
import { paymentModeEnum } from './enumModules.js';
import crypto from 'crypto';
import { AppError } from './app.error.js';

const secret = process.env.PAYSTACK_TEST_SECRET_KEY || '';

const payStackInitialized = async (payload) => {
  try {
    const { amountPaid, email, nairaValue } = payload;

    console.log('nairaValue:', nairaValue);
    const formattedAmount =
      parseInt(nairaValue.toString().replace(/,/g, ''), 10) * 100;

    const dataToSend = {
      email: email,
      amount: formattedAmount,
      metadata: payload,
    };

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const parsedData = JSON.parse(response.config.data);

    const amt = parseFloat(
      parsedData.metadata.amountPaid.toString().replace(/,/g, '')
    );

    if (isNaN(amt)) {
      throw new AppError(
        'Invalid amount provided. Please provide a valid number',
        400
      );
    }

    const data = {
      userId: payload.userId,
      training: payload.training,
      // enrollment: payload.enrollment,
      amountPaid: amountPaid,
      nairaValue: nairaValue,
      companyPaymentReference: payload.companyPaymentReference,
      transactionType: 'training fee payment',
      transactionStatus: 'pending',
      description: 'user paid for course',
      preferedClassMode: payload.preferedClassMode,
      paymentMode: payload.paymentMode,
      trainingFee: payload.trainingFee,
      balance: payload.balance,
      nextPaymentDate:
        payload.paymentMode === paymentModeEnum[1] && payload.nextPaymentDate,
      email: payload.email,
      status: response.data.status,
      message: response.data.message,
      reference: response.data.data.reference,
      authorizationUrl: response.data.data.authorization_url,
    };

    const result = await saveInitializedPayment(data);

    if (!result) {
      throw new AppError(
        'Unable to save Payment initialization before sending to paystack.',
        400
      );
    }

    // const payStackData2 = {
    //   status: response.data.status,
    //   message: response.data.message,
    //   reference: response.data.data.reference,
    //   companyPaymentReference: parsedData.metadata.companyPaymentReference,
    //   authorizationUrl: response.data.data.authorization_url,
    //   paymentId: pendingPayment._id,
    // };

    // const result = await updatePaymentInitializationWithPaystackData(
    //   payStackData2
    // );

    return { response, result };
  } catch (error) {
    if (error.response) {
      // Error from Paystack API
      throw new AppError(
        error.response.data.message || 'Error from Paystack',
        error.response.status || 400
      );
    }

    throw error;
  }
};

const payStackInvestmentPaymentInitialized = async (payload) => {
  try {
    const { nairaValue } = payload;

    console.log('nairaValue:', nairaValue);
    const formattedAmount =
      parseInt(nairaValue.toString().replace(/,/g, ''), 10) * 100;

    // email: email,
    const dataToSend = {
      amount: formattedAmount,
      metadata: payload,
    };

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const parsedData = JSON.parse(response.config.data);

    const amt = parseFloat(
      parsedData.metadata.amountPaid.toString().replace(/,/g, '')
    );

    if (isNaN(amt)) {
      throw new AppError(
        'Invalid amount provided. Please provide a valid number',
        400
      );
    }

    const data = {
      userId: payload.userId,
      investmentId: payload.investmentId,
      amountPaid: amountPaid,
      nairaValue: nairaValue,
      companyPaymentReference: payload.companyPaymentReference,
      transactionType: 'admin fee payment',
      transactionStatus: 'pending',
      description: 'user paid for admin fee',
      status: response.data.status,
      message: response.data.message,
      reference: response.data.data.reference,
      authorizationUrl: response.data.data.authorization_url,
    };

    const result = await saveInitializedInvestmentPayment(data);

    if (!result) {
      throw new AppError(
        'Unable to save Payment initialization before sending to paystack.',
        400
      );
    }

    return { response, result };
  } catch (error) {
    if (error.response) {
      // Error from Paystack API
      throw new AppError(
        error.response.data.message || 'Error from Paystack',
        error.response.status || 400
      );
    }

    throw error;
  }
};

const payStackPaymentBalanceInitialized = async (payload) => {
  try {
    const { amountPaid, email, nairaValue } = payload;

    const formattedAmount =
      parseInt(nairaValue.toString().replace(/,/g, ''), 10) * 100;

    const paystackData = {
      email: email,
      amount: formattedAmount,
      metadata: payload,
    };

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paystackData,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const parsedData = JSON.parse(response.config.data);

    const amt = parseFloat(
      parsedData.metadata.amountPaid.toString().replace(/,/g, '')
    );

    if (isNaN(amt)) {
      throw new AppError(
        'Invalid amount provided. Please provide a valid number',
        400
      );
    }

    const data = {
      userId: payload.userId,
      amountPaid: amountPaid,
      nairaValue: nairaValue,
      paymentId: payload.paymentId,
      balance: payload.balance,
      email: payload.email,
      transactionType: 'training fee balance payment',
      transactionStatus: 'pending',
      description: 'course balance',

      status: response.data.status,
      message: response.data.message,
      reference: response.data.data.reference,
      companyPaymentReference: parsedData.metadata.companyPaymentReference,
      authorizationUrl: response.data.data.authorization_url,
    };

    const result = await saveInitializedBalance(data);

    if (!result) {
      throw new AppError(
        'Unable to save balance initialization before sending to paystack.',
        400
      );
    }

    // const payStackData2 = {

    // };

    // const result = await updatePaymentInitializationWithPaystackData(
    //   payStackData2
    // );

    return { response, result };
  } catch (error) {
    if (error.response) {
      // Error from Paystack API
      throw new AppError(
        error.response.data.message || 'Error from Paystack',
        error.response.status || 400
      );
    }

    throw error;
  }
};

const paystackAuthUrlValidity = async (reference) => {
  try {
    const headers = {
      Authorization: `Bearer ${secret}`,
    };

    const url = `https://api.paystack.co/transaction/verify/${reference}`;

    const paystackResponse = await axios(url, { headers });

    const responseData = paystackResponse.data.data;
    const createdAt = new Date(responseData.created_at).getTime();
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    const email = responseData.metadata.email;
    const userId = responseData.metadata.userId;

    if (responseData.status === 'abandoned' && now - createdAt > twoHours) {
      const inValidObj = {
        message: 'Authorization URL has expired.',
        reference: reference,
        userId: userId,
        email: email,
      };

      return inValidObj;
    } else {
      const validObj = {
        message: 'Authorization URL still valid.',
        reference: reference,
        userId: userId,
        email: email,
      };

      return validObj;
    }
  } catch (error) {
    console.log(error);
    if (error.response) {
      // Error from Paystack API
      throw new AppError(
        error.response.data.message || 'Error from Paystack',
        error.response.status || 400
      );
    }

    throw error;
  }
};

const paystackCallBack = async (reference) => {
  try {
    const headers = {
      Authorization: `Bearer ${secret}`,
    };

    const url = `https://api.paystack.co/transaction/verify/${reference}`;

    const paystackResponse = await axios(url, { headers });

    console.log('callback paystackResponse:', paystackResponse);

    if (paystackResponse.data.data.status === 'success') {
      const data = {
        amount: paystackResponse.data.data.amount / 100,
        status: paystackResponse.data.data.status,
        reference: paystackResponse.data.data.reference,
      };

      const getTransaction =
        await findPaymentTransactionByReferenceAndUpdateStatus(data);

      return getTransaction;
    }

    throw new AppError('Payment verification failed.', 400);
  } catch (error) {
    if (error.response) {
      console.log(error.response.data.message);
      // Error from Paystack API
      throw new AppError(
        error.response.data.message || 'Error from Paystack',
        error.response.status || 400
      );
    }

    throw error;
  }
};

const paystackWebHook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash == req.headers['x-paystack-signature']) {
      const event = req.body;
      console.log('webhook event.event:', event.event);

      if (event.event === 'charge.success') {
        // GET ACCOUNT USING ACCOUNT ID AND USER ID
        const {
          reference,
          status,
          created_at,
          metadata: { amountPaid, userId, email },
          // authorization: { bank, account_name },
        } = event.data;

        const amt = parseFloat(amountPaid.toString().replace(/,/g, ''));

        if (isNaN(amt)) {
          throw new AppError(
            'Invalid amount provided. Please provide a valid number',
            400
          );
        }

        // get the transaction and check if transaction_status is still pending. then update it to completed
        const getTransaction =
          await findPaymentTransactionByReferenceAndUpdateStatus(
            reference,
            status
          );

        // if (getTransaction.length > 0) {
        // const data = {
        //   amount: amt,
        //   reference: reference,
        //   account_number: account_number,
        //   user_id: user_id,
        //   sender_bank: bank,
        //   sender_bank_account_name: account_name,
        // };

        // const transactionUpdate = await updateUserTransaction(data);

        // UPDATE THE ACCOUNT TO REFLECT THE AMOUNT CREDITED

        return getTransaction;
        // }

        // else {
        //   const info = 'transaction already recorded';
        //   console.log(info);
        //   return info;
        // }
      }
    }
  } catch (error) {
    console.log(error);
    if (error.response) {
      // Error from Paystack API
      throw new AppError(
        error.response.data.message || 'Error from Paystack',
        error.response.status || 400
      );
    }

    throw error;
  }
};

// paystackAuthUrlValidity('1peh0oyr6v');

export {
  paystackAuthUrlValidity,
  payStackPaymentBalanceInitialized,
  payStackInitialized,
  paystackWebHook,
  paystackCallBack,
  payStackInvestmentPaymentInitialized,
};
