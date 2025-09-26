import express, { Application } from 'express';
import routes from './routes';

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

export default app;