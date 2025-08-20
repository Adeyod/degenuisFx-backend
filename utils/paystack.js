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

// const paystackCallBack = async (reference) => {
//   try {
//     const headers = {
//       Authorization: `Bearer ${secret}`,
//     };

//     const url = `https://api.paystack.co/transaction/verify/${reference}`;

//     const paystackResponse = await axios(url, { headers });

//     console.log('paystackCallBack DATA:', paystackResponse.data.data);
//     console.log(
//       'paystackCallBack DATA CUSTOMER:',
//       paystackResponse.data.data.customer
//     );

//     if (paystackResponse.data.data.status === 'success') {
//       const data = {
//         amount: paystackResponse.data.data.amount / 100,
//         reference: paystackResponse.data.data.reference,
//         account_number: paystackResponse.data.data.metadata.account_number,
//         user_id: paystackResponse.data.data.metadata.user_id,
//       };
//       const getTransaction = await findTransactionByReferenceAndStatus(
//         data.reference
//       );

//       let accountUpdate = [];
//       let transactionUpdate;

//       if (getTransaction.length > 0) {
//         transactionUpdate = await updateUserTransaction(data);

//         console.log(transactionUpdate);
//         // update the transactions and accounts tables

//         accountUpdate = await creditUserAccountByUserIdAndAccountId({
//           user_id: data.user_id,
//           account_number: data.account_number,
//           amount: data.amount,
//         });

//         return { transactionUpdate, accountUpdate };
//       } else {
//         transactionUpdate = await findTransactionByReference(data.reference);
//         const result = await getUserAccountByAccountNumber(
//           data.user_id,
//           data.account_number
//         );

//         accountUpdate = Array.isArray(result) ? result : [result];
//         console.log('webhook has ran');
//         return { transactionUpdate, accountUpdate };
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

const paystackWebHook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash == req.headers['x-paystack-signature']) {
      const event = req.body;
      console.log('event.data:', event.data);
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
          throw new Error(
            'Invalid amount provided. Please provide a valid number'
          );
        }

        // get the transaction and check if transaction_status is still pending. then update it to completed
        const getTransaction =
          await findPaymentTransactionByReferenceAndUpdateStatus(
            reference,
            status
          );

        console.log('getTransaction:', getTransaction);
        if (getTransaction.length > 0) {
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
        } else {
          const info = 'transaction already recorded';
          console.log(info);
          return info;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export { payStackInitialized, paystackWebHook };
