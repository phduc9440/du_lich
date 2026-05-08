/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Card, Col, Row, Select, DatePicker, Table, InputNumber, Space, Typography, Input } from "antd";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line } from 'recharts';
import { useGetTopTours, useGetTopRatedTours, } from '../../../services/reportService';
import { useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { useUpdateParams } from '../../../hooks/useUpdateParams';

const AdminStatsToursPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<'day' | 'month' | 'quarter' | 'year'>(searchParams.get('range') as any || 'day');
  const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
  const [dateRange, setDateRange] = useState({ from: searchParams.get('from') || startOfMonth, to: searchParams.get('to') || endOfMonth });
  const [metric, setMetric] = useState<'revenue' | 'tickets'>('revenue');
  const [limit, setLimit] = useState<number>(10);
  const [inputValueTableTopRevenue, setInputValueTableTopRevenue] = useState("");
  const [searchTextRevenue, setSearchTextRevenue] = useState(searchParams.get("search_top_revenue") || "");
  const [inputValueTableTopRate, setInputValueTableTopRate] = useState("");
  const [searchTextRate, setSearchTextRate] = useState(searchParams.get("search_top_rate") || "");
  const { updateParams } = useUpdateParams();

  const params = useMemo(() => {
    return {
      range,
      from: dateRange.from,
      to: dateRange.to,
      metric,
      limit: limit,
      // BE top-tours nhận query 'search'
      search: searchTextRevenue || undefined,
      // BE top-rated-tours hiện không hỗ trợ search, giữ nguyên để không đổi UI
      search_top_rate: searchTextRate || undefined,
    }
  }, [range, dateRange.from, dateRange.to, metric, limit, searchTextRevenue, searchTextRate]);
  // call api
  const topToursQuery = useGetTopTours(params);
  const topRatedQuery = useGetTopRatedTours(params);

  const chartData = ((topToursQuery.data?.data as any)?.data ?? []).map((t: any) => ({
    tourCode: t.tour?.tour_code ?? `#${t.rank}`,
    revenue: Math.round((t.totalRevenue ?? 0)),
    tickets: t.totalTickets ?? 0,
    orders: t.orderCount ?? 0,
  }));
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
              <Space>
                <Typography.Text>Giới hạn:</Typography.Text>
                <InputNumber min={1} value={limit} onChange={(v) => {
                  setLimit(v as number)
                  updateParams({ limit: v })
                }} />
              </Space>
              <Select value={metric}
                options={[{ label: 'Theo doanh thu', value: 'revenue' }, { label: 'Theo số vé', value: 'tickets' }]}
                onChange={(v) => { setMetric(v); updateParams({ metric: v }); }}
              />
              <Typography.Text>Từ: {dateRange.from}</Typography.Text>
              <Typography.Text>Đến: {dateRange.to}</Typography.Text>
              <Typography.Text>Tổng số tour: {topToursQuery.data?.data?.total}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
      <Card title="Doanh thu của tour">
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tourCode" />
              <YAxis tickFormatter={(value: number) =>
                value.toLocaleString("vi-VN")
              } />
              <RechartsTooltip />
              <Legend />

              <Line type="monotone" dataKey="revenue" name="Doanh thu (VND)" stroke="#1890ff" strokeWidth={2} />
              <Line type="monotone" dataKey="tickets" name="Vé bán ra" stroke="#52c41a" strokeWidth={2} />
              <Line type="monotone" dataKey="orders" name="Số đơn" stroke="#faad14" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>

        </div>
      </Card>
      <Card title="Top tour theo doanh thu - số vé">
        <Input.Search
          className='mb-4'
          placeholder={'Tìm theo mã hoặc tên...'}
          value={inputValueTableTopRevenue}
          onChange={(e) => setInputValueTableTopRevenue(e.target.value)}
          onSearch={() => {
            setSearchTextRevenue(inputValueTableTopRevenue);
            updateParams({
              search: inputValueTableTopRevenue || undefined,
              page: "1",
            });
          }}
          enterButton
          loading={topToursQuery.isLoading}
        />
        <Table size="middle"
          columns={[{ title: '#', dataIndex: 'rank', key: 'rank' },
          { title: 'Mã tour', dataIndex: ['tour', 'tour_code'], key: 'tour_code' },
          { title: 'Tour', dataIndex: ['tour', 'title'], key: 'title' },
          {
            title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'totalRevenue',
            render: (value: number) => (value).toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
            sorter: (a: any, b: any) => a.totalRevenue - b.totalRevenue,
            showSorterTooltip: { title: 'Sắp xếp theo doanh thu' }
          },
          {
            title: 'Vé bán ra', dataIndex: 'totalTickets', key: 'totalTickets',
            sorter: (a: any, b: any) => a.totalTickets - b.totalTickets,
            showSorterTooltip: { title: 'Sắp xếp theo số vé bán ra' }
          },
          {
            title: 'Số đơn', dataIndex: 'orderCount', key: 'orderCount',
            sorter: (a: any, b: any) => a.orderCount - b.orderCount,
            showSorterTooltip: { title: 'Sắp xếp theo số đơn' }
          }
          ]}
          dataSource={(topToursQuery.data?.data as any)?.data ?? []} pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey={(r: any) => r.rank} />
      </Card>
      <Card title="Top tour theo đánh giá">
        <Input.Search
          className='mb-4'
          placeholder={'Tìm theo mã hoặc tên...'}
          value={inputValueTableTopRate}
          onChange={(e) => setInputValueTableTopRate(e.target.value)}
          onSearch={() => {
            setSearchTextRate(inputValueTableTopRate);
            updateParams({
              search: inputValueTableTopRate || undefined,
              page: "1",
            });
          }}
          enterButton
          loading={topToursQuery.isLoading}
        />
        <Table size="middle"
          columns={[{ title: '#', dataIndex: 'rank', key: 'rank' },
          { title: 'Mã tour', dataIndex: ['tour', 'tour_code'], key: 'tour_code' },
          { title: 'Tour', dataIndex: ['tour', 'title'], key: 'title' },
          {
            title: 'Đánh giá trung bình', dataIndex: 'averageRating', key: 'averageRating',
            sorter: (a: any, b: any) => a.averageRating - b.averageRating,
            showSorterTooltip: { title: 'Sắp xếp theo đánh giá trung bình' }
          },
          {
            title: 'Số đánh giá', dataIndex: 'reviewCount', key: 'reviewCount',
            sorter: (a: any, b: any) => a.reviewCount - b.reviewCount,
            showSorterTooltip: { title: 'Sắp xếp theo số đánh giá' }
          }
          ]}
          dataSource={(topRatedQuery.data as any)?.data ?? []} pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey={(r: any) => r.rank} />
      </Card>
    </div>
  )
}

export default AdminStatsToursPage;
