import axios from 'axios';

const calculateNextPaymentDay = () => {
  const gracePeriod = 30;
  const today = new Date();

  let backendNextPaymentDate = null;

  backendNextPaymentDate = new Date(today);
  backendNextPaymentDate.setDate(today.getDate() + gracePeriod);

  const backendDateStr = backendNextPaymentDate.toISOString().split('T')[0];

  return backendDateStr;
};

const generatePaymentReference = (payload) => {
  const { trainingId, userId, paymentMode } = payload;

  console.log('payload:', payload);

  if (!trainingId || !userId || !paymentMode) {
    throw new Error(
      'Please provide training ID, user ID and payment mode to generate payment reference number.',
      400
    );
  }

  const ref = `TRAIN_${paymentMode.toUpperCase()}_${trainingId}_${userId}_${Date.now()}`;

  return ref;
};

const getStudentLocation = async (ip) => {
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
    return {
      country: data.country,
      region: data.regionName,
      city: data.city,
    };
  } catch (error) {
    console.error('Error getting location:', error.message);
    return null;
  }
};

export {
  getStudentLocation,
  calculateNextPaymentDay,
  generatePaymentReference,
};
