import { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/customErrors';

const handleUnexpectedRequest: RequestHandler = (_req, res) => {
  res.sendStatus(StatusCodes.NOT_FOUND);
};

const handleAppError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const { statusCode, message, errors } = err;
    res.status(statusCode).json({ message, errors });
  } else {
    console.error('[UnhandledError]', err instanceof Error ? err.stack : err);
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export default () => [handleUnexpectedRequest, handleAppError];
