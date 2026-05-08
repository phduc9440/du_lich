import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse extends Error {
  statusCode?: number;
  errors?: any;
}

export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = 'Dữ liệu không hợp lệ';
    error = {
      name: err.name,
      message,
      statusCode: 400,
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Dữ liệu đã tồn tại';
    error = {
      name: err.name,
      message,
      statusCode: 400,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token không hợp lệ';
    error = {
      name: err.name,
      message,
      statusCode: 401,
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token đã hết hạn';
    error = {
      name: err.name,
      message,
      statusCode: 401,
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Lỗi máy chủ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route - ${req.originalUrl}`,
  });
};

