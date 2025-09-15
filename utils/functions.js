import axios from 'axios';
import { AppError } from './app.error.js';

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

const getUserLocation = async (long, lat) => {
  try {
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${process.env.LOCATIONIQ_API_KEY}&lat=${lat}&lon=${long}&format=json`;

    const response = await axios.get(url);
    console.log('response:', response.data);
    const country = response.data.address.country;
    const countryCode = response.data.address.country_code.toUpperCase();
    return { country, countryCode };
  } catch (error) {
    console.log(error);
  }
};

const getUsdToNgnRate = async () => {
  const url = `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}`;

  try {
    const options = {
      method: 'GET',
      url: url,
      paranms: {
        base: 'USD',
      },
    };
    const response = await axios.request(options);
    console.log("response.data.rates['NGN']:", response.data.rates['NGN']);
    return response.data.rates['NGN'].toFixed(2);
  } catch (error) {
    console.error(
      'Error fetching USD→NGN rate:',
      error.response?.data || error.message
    );
    throw new AppError('Exchange rate service error', 502);
  }
};

const capitalizeFirstLetter = (payload) => {
  const value = payload.charAt(0).toUpperCase() + payload.slice(1);

  return value;
};

const formatDate = (date) => {
  const f_date = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).formatToParts(date);

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const weekDay = f_date.find((p) => p.type === 'weekday')?.value;
  const month = f_date.find((p) => p.type === 'month')?.value;
  const day = f_date.find((p) => p.type === 'day')?.value;
  const year = f_date.find((p) => p.type === 'year')?.value;

  const dateFormatted = `${weekDay},${month} ${day}, ${year}, ${time}`;

  return dateFormatted;
};

export {
  getUsdToNgnRate,
  getUserLocation,
  formatDate,
  capitalizeFirstLetter,
  getStudentLocation,
  calculateNextPaymentDay,
  generatePaymentReference,
};
