/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { Card, Col, Row, Select, DatePicker, Statistic, Space, Typography } from "antd";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line } from 'recharts';
import { useGetRevenueStats } from '../../../services/reportService';
import { useSearchParams } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const AdminStatsRevenuePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<'day' | 'month' | 'quarter' | 'year'>(searchParams.get('range') as any || 'day');
  const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
  const [dateRange, setDateRange] = useState({ from: searchParams.get('from') || startOfMonth, to: searchParams.get('to') || endOfMonth });
  const { updateParams } = useUpdateParams();

  // query params for report endpoints
  const params = useMemo(() => {
    return {
      range,
      from: dateRange.from,
      to: dateRange.to,
    }
  }, [range, dateRange]);

  const revenueQuery = useGetRevenueStats(params);

  const revenueData = revenueQuery.data?.data?.breakdown.map((r: any) => (
    { name: r.period, revenue: Math.round(Number(r.totalRevenue)) }
  ));
  const handleSelectQuarter = (date: Dayjs | null) => {
    if (!date) return;

    const quarter = Math.floor(date.month() / 3) + 1;     // 1,2,3,4
    const year = date.year();

    // Tính tháng bắt đầu – kết thúc
    const startMonthIndex = (quarter - 1) * 3; // 0-based month index
    const endMonthIndex = startMonthIndex + 2;

    const start = dayjs(`${year}-${String(startMonthIndex + 1).padStart(2, '0')}-01`);
    const end = dayjs(`${year}-${String(endMonthIndex + 1).padStart(2, '0')}-01`).endOf('month');

    setDateRange({
      from: start.format("YYYY-MM-DD"),
      to: end.format("YYYY-MM-DD"),
    });
    updateParams({ from: start.format("YYYY-MM-DD"), to: end.format("YYYY-MM-DD") });
  }
  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Space wrap>
              <Select value={range}
                onChange={(v) => { setRange(v); updateParams({ range: v }); }}
                options={[{ label: 'Theo ngày', value: 'day' },
                { label: 'Theo tháng', value: 'month' }, { label: 'Theo quý', value: 'quarter' },
                { label: 'Theo năm', value: 'year' }]}
                placeholder="Chọn khoảng thời gian"
              />
              {range !== 'quarter' && (
                <DatePicker.RangePicker
                  value={[dateRange.from ? dayjs(dateRange.from) : null, dateRange.to ? dayjs(dateRange.to) : null]}
                  onChange={(_, dateStrings) => {
                    setDateRange({ from: dateStrings?.[0], to: dateStrings?.[1] })
                    updateParams({ from: dateStrings?.[0], to: dateStrings?.[1] });
                  }}
                  picker={range === 'month' ? 'month' : range === 'year' ? 'year' : 'date'}
                  placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                />
              )}
              {range === 'quarter' && (
                <Space>
                  <DatePicker picker="quarter" placeholder="Chọn quý"
                    onChange={(date) => handleSelectQuarter(date)} />
                </Space>
              )}
              <Typography.Text>Từ: {dateRange.from}</Typography.Text>
              <Typography.Text>Đến: {dateRange.to}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="Tổng doanh thu" value={(revenueQuery.data as any)?.data?.summary?.totalRevenue?.toLocaleString?.('vi-VN', { style: 'currency', currency: 'VND' }) ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="Tổng đơn" value={(revenueQuery.data as any)?.data?.summary?.orderCount ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="Tổng vé" value={(revenueQuery.data as any)?.data?.summary?.totalTickets ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="Giá trung bình đơn" value={((revenueQuery.data as any)?.data?.summary?.averageOrderValue ?? 0).toLocaleString?.('vi-VN', { style: 'currency', currency: 'VND' })} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col lg={24}>
          <Card title="Doanh thu theo tháng (VND)">
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis name="Doanh thu (VND)" tickFormatter={(v) => `${v}m`} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu (VND)" stroke="#1677ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminStatsRevenuePage;

