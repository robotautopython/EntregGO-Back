import type { Response } from 'express';

export const sendSuccess = <T>(response: Response, data: T, message: string, statusCode = 200) => {
  return response.status(statusCode).json({
    success: true,
    data,
    message,
  });
};
