import axios from 'axios';
import { saveInitializedPayment } from '../repository/paymentRepository.js';
import { paymentModeEnum } from './enumModules.js';

const secret = process.env.PAYSTACK_TEST_SECRET_KEY || '';

const payStackInitialized = async (payload) => {
  const { amountPaid, email } = payload;

  const formattedAmount =
    parseInt(amountPaid.toString().replace(/,/g, ''), 10) * 100;
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

  // console.log('response:', response);

  const parsedData = JSON.parse(response.config.data);

  const amt = parseFloat(
    parsedData.metadata.amountPaid.toString().replace(/,/g, '')
  );

  if (isNaN(amt)) {
    throw new Error('Invalid amount provided. Please provide a valid number');
  }

  const data = {
    status: response.data.status,
    message: response.data.message,
    reference: response.data.data.reference,
    userId: parsedData.metadata.userId,
    amountPaid: amt,
    transactionType: 'training fee payment',
    transactionStatus: 'pending',
    description: 'user paid for course',
    authorizationUrl: response.data.data.authorization_url,
    preferedClassMode: parsedData.metadata.preferedClassMode,
    paymentMode: parsedData.metadata.paymentMode,
    trainingFee: parsedData.metadata.trainingFee,
    balance: parsedData.metadata.balance,
    nextPaymentDate:
      parsedData.metadata.paymentMode === paymentModeEnum[1] &&
      parsedData.metadata.nextPaymentDate,
    email: parsedData.metadata.email,
  };

  console.log('response.response.data.data:', response.data.data);

  const result = await saveInitializedPayment(data);

  console.log('result:', result);

  return { response, result };
};

export { payStackInitialized };
