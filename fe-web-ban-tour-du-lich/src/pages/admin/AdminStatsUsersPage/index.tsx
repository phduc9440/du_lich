/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Card, Col, Row, Select, DatePicker, Table, InputNumber, Space, Typography, Input } from "antd";
import { useGetTopUsers, } from '../../../services/reportService';
import { useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { useUpdateParams } from '../../../hooks/useUpdateParams';

const AdminStatsUsersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<'day' | 'month' | 'quarter' | 'year'>(searchParams.get('range') as any || 'day');
  const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
  const [dateRange, setDateRange] = useState({ from: searchParams.get('from') || startOfMonth, to: searchParams.get('to') || endOfMonth });
  const [limit, setLimit] = useState<number>(searchParams.get("limit") as unknown as number || 10);
  const [inputValue, setInputValue] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const { updateParams } = useUpdateParams();

  const params = useMemo(() => {
    return {
      range,
      from: dateRange.from,
      to: dateRange.to,
      limit: limit,
      search: searchText || undefined,
    }
  }, [range, dateRange.from, dateRange.to, limit, searchText]);
  // call api
  const topUsersQuery = useGetTopUsers(params);
  
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
              <Typography.Text>Từ: {dateRange.from}</Typography.Text>
              <Typography.Text>Đến: {dateRange.to}</Typography.Text>
              <Typography.Text>Tổng khách hàng: {topUsersQuery.data?.data?.total}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
      <Card title={`Top khách hàng theo tổng chi tiêu`}>
        <Input.Search
          className='mb-4'
          placeholder={'Tìm theo mã hoặc tên...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSearch={() => {
            setSearchText(inputValue);
            updateParams({
              search: inputValue || undefined,
              page: "1",
            });
          }}
          enterButton
          loading={topUsersQuery.isLoading}
        />
        <Table size="middle"
          columns={[{ title: '#', dataIndex: 'rank', key: 'rank' },
          { title: 'Username', dataIndex: ['user', 'username'], key: 'username' },
          { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
          { title: 'Tổng chi(vnd)', dataIndex: 'totalSpent', key: 'totalSpent',
            render: (text: number) => text.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
            sorter: (a: any, b: any) => a.totalSpent - b.totalSpent,
            showSorterTooltip: { title: 'Sắp xếp theo tổng chi tiêu' }
           },
          { title: 'Đơn đã đặt', dataIndex: 'orderCount', key: 'orderCount',
            sorter: (a: any, b: any) => a.orderCount - b.orderCount,
            showSorterTooltip: { title: 'Sắp xếp theo số đơn đã đặt' }
           },
          { title: 'Đặt lần cuối', dataIndex: 'lastOrderAt', key: 'orderCount', render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
            sorter: (a: any, b: any) => dayjs(a.lastOrderAt).unix() - dayjs(b.lastOrderAt).unix(),
            showSorterTooltip: { title: 'Sắp xếp theo thời gian đặt lần cuối' }
           },
          ]}
          dataSource={(topUsersQuery.data?.data as any)?.data ?? []} pagination={{ pageSize: 10,  showSizeChanger: false }}
          rowKey={(r: any) => r.rank} />
      </Card>
    </div>
  )
}

export default AdminStatsUsersPage;
