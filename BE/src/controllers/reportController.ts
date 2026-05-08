import { Request, Response } from 'express';
import reportService from '../services/reportService';
import { RangeUnit } from '../utils/dateRange';

const parseRangeUnit = (value?: string | string[]): RangeUnit | undefined => {
  if (!value) return undefined;
  const normalized = Array.isArray(value) ? value[0] : value;
  if (['day', 'month', 'quarter', 'year'].includes(normalized)) {
    return normalized as RangeUnit;
  }
  return undefined;
};

const parseNumber = (value?: string | string[], fallback?: number): number | undefined => {
  if (value === undefined) return fallback;
  const str = Array.isArray(value) ? value[0] : value;
  const parsed = Number(str);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
};

const parseString = (value?: string | string[]): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseInteger = (value?: string | string[]): number | undefined => {
  if (value === undefined) return undefined;
  const str = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(str, 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
};

const handleError = (res: Response, error: any) => {
  console.error('❌ Report controller error:', error);
  return res.status(400).json({
    success: false,
    message: error?.message || 'Không thể lấy dữ liệu thống kê',
  });
};

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const range = parseRangeUnit(req.query.range as string);
    const from = parseString(req.query.from as string);
    const to = parseString(req.query.to as string);
    const data = await reportService.getRevenueStats({
      range,
      from,
      to,
      startMonth: parseInteger(req.query.startMonth as string),
      startYear: parseInteger(req.query.startYear as string),
      endMonth: parseInteger(req.query.endMonth as string),
      endYear: parseInteger(req.query.endYear as string),
      startQuarter: parseInteger(req.query.startQuarter as string),
      endQuarter: parseInteger(req.query.endQuarter as string),
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return handleError(res, error);
  }
};

export const getTopTours = async (req: Request, res: Response) => {
  try {
    const range = parseRangeUnit(req.query.range as string);
    const from = parseString(req.query.from as string);
    const to = parseString(req.query.to as string);
    const metricParam = parseString(req.query.metric as string);
    const metric = metricParam === 'tickets' ? 'tickets' : 'revenue';
    const limit = parseNumber(req.query.limit as string, 10);
    const search_top_revenue = parseString(req.query.search_top_revenue as string);

    const data = await reportService.getTopTours({
      range,
      from,
      to,
      metric,
      limit,
      search: search_top_revenue,
      startMonth: parseInteger(req.query.startMonth as string),
      startYear: parseInteger(req.query.startYear as string),
      endMonth: parseInteger(req.query.endMonth as string),
      endYear: parseInteger(req.query.endYear as string),
      startQuarter: parseInteger(req.query.startQuarter as string),
      endQuarter: parseInteger(req.query.endQuarter as string),
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return handleError(res, error);
  }
};

export const getTopRatedTours = async (req: Request, res: Response) => {
  try {
    const range = parseRangeUnit(req.query.range as string);
    const from = parseString(req.query.from as string);
    const to = parseString(req.query.to as string);
    const limit = parseNumber(req.query.limit as string, 10);
    const minReviews = parseNumber(req.query.minReviews as string, 3);
    const search_top_rate = parseString(req.query.search_top_rate as string);

    const data = await reportService.getTopRatedTours({
      range,
      from,
      to,
      limit,
      minReviews,
      search: search_top_rate,
      startMonth: parseInteger(req.query.startMonth as string),
      startYear: parseInteger(req.query.startYear as string),
      endMonth: parseInteger(req.query.endMonth as string),
      endYear: parseInteger(req.query.endYear as string),
      startQuarter: parseInteger(req.query.startQuarter as string),
      endQuarter: parseInteger(req.query.endQuarter as string),
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return handleError(res, error);
  }
};

export const getTopUsers = async (req: Request, res: Response) => {
  try {
    const range = parseRangeUnit(req.query.range as string);
    const from = parseString(req.query.from as string);
    const to = parseString(req.query.to as string);
    const limit = parseNumber(req.query.limit as string, 20);
    const search = parseString(req.query.search as string);

    const data = await reportService.getTopUsers({
      range,
      from,
      to,
      limit,
      search,
      startMonth: parseInteger(req.query.startMonth as string),
      startYear: parseInteger(req.query.startYear as string),
      endMonth: parseInteger(req.query.endMonth as string),
      endYear: parseInteger(req.query.endYear as string),
      startQuarter: parseInteger(req.query.startQuarter as string),
      endQuarter: parseInteger(req.query.endQuarter as string),
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return handleError(res, error);
  }
};

