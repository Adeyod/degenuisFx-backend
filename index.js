import express from 'express';
import cookieParser from 'cookie-parser';
import DBConfig from './DBConfig/DBConfig.js';
import cors from 'cors';
import studentRoutes from './route/studentRoutes.js';
import investorRoutes from './route/investorRoutes.js';
import otherRoutes from './route/otherRoutes.js';
import helmet from 'helmet';
import globalErrorHandler from './utils/globalErrorHandler.js';

const app = express();

// Trust first proxy
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: [
      'https://degeniusfxacademy.netlify.app',
      // 'http://localhost:5173'
    ],
    credentials: true,
  })
);

app.get('/', (req, res) => {
  res.send('Welcome to Degenius FX website');
  return;
});

app.use('/api/student', studentRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/v2', otherRoutes);

app.use(globalErrorHandler);

const port = process.env.PORT || 4444;

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});

/*

*/
