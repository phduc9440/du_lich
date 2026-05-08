import { Response } from 'express';

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = (
  res: Response,
  data: any = null,
  message: string = 'Thành công',
  statusCode: number = 200
) => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string = 'Có lỗi xảy ra',
  statusCode: number = 500
) => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return res.status(statusCode).json(response);
};

export const paginationResponse = (
  res: Response,
  data: any,
  page: number,
  limit: number,
  total: number,
  message: string = 'Thành công'
) => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(response);
};

// Aliases cho controllers
export const sendSuccess = (
  res: Response,
  message: string = 'Thành công',
  data: any = null,
  pagination?: any,
  statusCode: number = 200
) => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = 'Có lỗi xảy ra',
  statusCode: number = 400
) => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return res.status(statusCode).json(response);
};

