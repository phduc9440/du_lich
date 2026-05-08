import { Op } from 'sequelize';

export type RangeUnit = 'day' | 'month' | 'quarter' | 'year';

export interface DateRangeOptions {
  range?: RangeUnit;
  from?: string;
  to?: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  startQuarter?: number;
  endQuarter?: number;
}

export interface DateRangeResult {
  startDate: Date;
  endDate: Date;
}

const RANGE_DEFAULT_DAYS: Record<RangeUnit, number> = {
  day: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const normalizeDate = (input: string | Date): Date => {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error('Ngày tháng không hợp lệ');
  }
  return date;
};

const ensureMonth = (month?: number) => {
  if (!month || month < 1 || month > 12) {
    throw new Error('Tháng phải nằm trong khoảng 1-12');
  }
  return month;
};

const ensureQuarter = (quarter?: number) => {
  if (!quarter || quarter < 1 || quarter > 4) {
    throw new Error('Quý phải nằm trong khoảng 1-4');
  }
  return quarter;
};

const ensureYear = (year?: number) => {
  if (!year || year < 1970) {
    throw new Error('Năm không hợp lệ');
  }
  return year;
};

export const resolveDateRange = ({
  range = 'month',
  from,
  to,
  startMonth,
  startYear,
  endMonth,
  endYear,
  startQuarter,
  endQuarter,
}: DateRangeOptions): DateRangeResult => {
  if (from && to) {
    const lower = normalizeDate(from);
    const upper = normalizeDate(to);
    lower.setHours(0, 0, 0, 0);
    upper.setHours(23, 59, 59, 999);

    if (lower > upper) {
      throw new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
    }

    return { startDate: lower, endDate: upper };
  }

  let lowerBound: Date;
  let upperBound: Date;

  switch (range) {
    case 'month': {
      if (startYear && endYear && (startMonth || endMonth)) {
        const sMonth = ensureMonth(startMonth ?? endMonth);
        const eMonth = ensureMonth(endMonth ?? startMonth);
        const sYear = ensureYear(startYear);
        const eYear = ensureYear(endYear);

        lowerBound = new Date(sYear, sMonth - 1, 1);
        upperBound = new Date(eYear, eMonth, 0, 23, 59, 59, 999);
      } else {
        upperBound = normalizeDate(new Date());
        const days = RANGE_DEFAULT_DAYS.month;
        lowerBound = new Date(upperBound);
        lowerBound.setDate(lowerBound.getDate() - days + 1);
      }
      break;
    }
    case 'quarter': {
      if (startYear && endYear && (startQuarter || endQuarter)) {
        const sQuarter = ensureQuarter(startQuarter ?? endQuarter);
        const eQuarter = ensureQuarter(endQuarter ?? startQuarter);
        const sYear = ensureYear(startYear);
        const eYear = ensureYear(endYear);

        const sMonth = (sQuarter - 1) * 3;
        const eMonth = eQuarter * 3;

        lowerBound = new Date(sYear, sMonth, 1);
        upperBound = new Date(eYear, eMonth, 0, 23, 59, 59, 999);
      } else {
        upperBound = normalizeDate(new Date());
        const days = RANGE_DEFAULT_DAYS.quarter;
        lowerBound = new Date(upperBound);
        lowerBound.setDate(lowerBound.getDate() - days + 1);
      }
      break;
    }
    case 'year': {
      if (startYear && endYear) {
        const sYear = ensureYear(startYear);
        const eYear = ensureYear(endYear);
        lowerBound = new Date(sYear, 0, 1);
        upperBound = new Date(eYear, 11, 31, 23, 59, 59, 999);
      } else {
        upperBound = normalizeDate(new Date());
        const days = RANGE_DEFAULT_DAYS.year;
        lowerBound = new Date(upperBound);
        lowerBound.setDate(lowerBound.getDate() - days + 1);
      }
      break;
    }
    case 'day':
    default: {
      upperBound = normalizeDate(new Date());
      const days = RANGE_DEFAULT_DAYS[range] ?? 7;
      lowerBound = new Date(upperBound);
      lowerBound.setDate(lowerBound.getDate() - days + 1);
      break;
    }
  }

  lowerBound.setHours(0, 0, 0, 0);
  upperBound.setHours(23, 59, 59, 999);

  if (lowerBound > upperBound) {
    throw new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
  }

  return {
    startDate: lowerBound,
    endDate: upperBound,
  };
};

type BetweenDateFilter = {
  [Op.between]: [Date, Date];
};

export const buildDateFilter = (startDate: Date, endDate: Date): BetweenDateFilter => ({
  [Op.between]: [startDate, endDate],
});

