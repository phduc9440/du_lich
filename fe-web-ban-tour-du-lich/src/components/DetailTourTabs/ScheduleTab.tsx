import { Timeline, Typography } from "antd";

const ScheduleTab = ({ data }: { data: {day_number: number, title: string, detail: string}[] }) => {
  return (
    <>
      <Typography.Title level={3}>Lịch trình</Typography.Title>
      <Timeline
        items={data.map((day) => ({
          children: (
            <div>
              <Typography.Text strong>Ngày {day.day_number}: {day.title}</Typography.Text>
              <p>{day.detail}</p>
            </div>
          ),
        }))}
      />
    </>
  );
};

export default ScheduleTab;
