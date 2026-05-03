import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Route Imports
import workspaceRoutes from './routes/workspaceRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import actionItemRoutes from './routes/actionItemRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/health.js';

const app = express();

// Swagger Definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Collaborative Team Hub API',
      version: '1.0.0',
      description: 'API documentation for the Collaborative Team Hub platform.',
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'httpOnly JWT cookie for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            avatarUrl: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            accentColour: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    withCredentials: true,
  },
}));

// Security Middleware
app.use(helmet());

// Logging Middleware
app.use(morgan('dev'));

// CORS Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Collaborative Team Hub API is running' });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:id/goals', goalRoutes);
app.use('/api/workspaces/:id/announcements', announcementRoutes);
app.use('/api/workspaces/:id/action-items', actionItemRoutes);
app.use('/api/workspaces/:id', analyticsRoutes); // Handles /analytics and /export
app.use('/api/users', userRoutes);
app.use('/api', analyticsRoutes); // Handles /notifications

// 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
