import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';
import fileRoutes from './routes/file.routes';

import cors from 'cors';

// Load environment variables
dotenv.config();



// Initialize Express app
const app = express();

// Enable CORS for all requests
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());


// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/files', fileRoutes);
app.use('/users', userRoutes); // User route

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
