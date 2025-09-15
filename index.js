import express from 'express';
import cookieParser from 'cookie-parser';
import DBConfig from './DBConfig/DBConfig.js';
import cors from 'cors';
import helmet from 'helmet';
import ngrok from '@ngrok/ngrok';
import globalErrorHandler from './utils/globalErrorHandler.js';

import studentRoutes from './route/studentRoutes.js';
import paymentRoutes from './route/paymentRoutes.js';
import investorRoutes from './route/investorRoutes.js';
import investmentRoutes from './route/investmentRoutes.js';
import otherRoutes from './route/otherRoutes.js';
import authRoutes from './route/authRoutes.js';
import trainingRoute from './route/trainingRoute.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust first proxy
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: ['https://degeniusfxacademy.netlify.app', 'http://localhost:5173'],
    credentials: true,
  })
);

app.get('/', (req, res) => {
  res.send('Welcome to Degenius FX website');
  return;
});

globalErrorHandler();

app.use('/api/student', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingRoute);
app.use('/api/others', otherRoutes);

app.use(errorHandler);

const port = process.env.PORT || 4444;

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});

ngrok
  .connect({ addr: port, authtoken: process.env.NGROK_AUTHTOKEN || '' })
  .then((listener) => console.log(`Ingress established at: ${listener.url()}`))
  .catch((error) => {
    console.error(error);
  });

/*

*/
