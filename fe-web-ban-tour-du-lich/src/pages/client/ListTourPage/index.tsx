import {
  Divider,
  Typography,
  Input,
  DatePicker,
  Button,
  Rate,
  Checkbox,
  Row,
  Col,
  Pagination,
  Drawer,
  Grid,
  InputNumber,
  Skeleton,
  Empty,
} from "antd";
import heroBanner from "../../../assets/imgs/heroBanner.png";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import TourCard from "../../../components/TourCard";
import { BarsOutlined } from "@ant-design/icons";
import { useGetCategory, useGetToursQuery } from "../../../services/tourService";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const ListTourPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const { updateParams, setParams } = useUpdateParams();
  // state filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
  const [limit] = useState<number>(Number(searchParams.get("limit") || 8));
  const [minPrice, setMinPrice] = useState<number | undefined>(Number(searchParams.get("min_price") || undefined));
  const [maxPrice, setMaxPrice] = useState<number | undefined>(Number(searchParams.get("max_price") || undefined));
  const [tourTypes, setTourTypes] = useState<string[]>(
    searchParams.get("category_ids")?.split(",").filter(Boolean) || []
  );
  const [regions, setRegions] = useState<string[]>(
    searchParams.get("regions")?.split(",").filter(Boolean) || []
  );
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("stock") === "1"
  );
  const [minRating, setMinRating] = useState<number>(
    Number(searchParams.get("rating") || 0)
  );
  const [inputValue, setInputValue] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(
    searchParams.get('start_date') && searchParams.get('end_date') ? [dayjs(searchParams.get('start_date')), dayjs(searchParams.get('end_date'))] : null
  );
  const params = useMemo(() => {
    return {
      page,
      limit,
      search: searchText || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      category_ids: tourTypes.length > 0 ? tourTypes.join(",") : undefined,
      regions: regions.length > 0 ? regions.join(",") : undefined,
      stock: inStockOnly ? 1 : undefined,
      rating: minRating > 0 ? minRating : undefined,
      start_date: dateRange ? dateRange[0].format("YYYY-MM-DD") : undefined,
      end_date: dateRange ? dateRange[1].format("YYYY-MM-DD") : undefined,
    }
  }, [page, limit, searchText, minPrice, maxPrice, tourTypes, regions, inStockOnly, minRating, dateRange])

  // call api
  const getToursApi = useGetToursQuery(params);
  const getTourCategoryApi = useGetCategory();

  // Clear Filter
  const handleClearFilter = () => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setTourTypes([]);
    setRegions([]);
    setInStockOnly(false);
    setMinRating(0);
    setInputValue("");
    setSearchText("");
    setDateRange(null);
    setPage(1);
    setParams({ page: "1", limit: String(limit) });
  };
  const FilterContent = (
    <>
      <Typography.Title level={4} className="text-center !mb-6">Bộ lọc</Typography.Title>
      <Typography.Text strong>Khoảng giá (VND)</Typography.Text>
      <div className="flex gap-2 mt-2">
        <InputNumber
          className="w-full"
          value={minPrice}
          onChange={(val) => {
            setMinPrice(val !== undefined ? Number(val) : undefined)
            updateParams({ min_price: val })
          }
          }
          placeholder="Giá từ"
        />
        <InputNumber
          className="w-full"
          value={maxPrice}
          onChange={(val) => {
            setMaxPrice(val !== undefined ? Number(val) : undefined)
            updateParams({ max_price: val })
          }
          }
          placeholder="Đến"
        />
      </div>

      <Divider />
      <Typography.Text strong>Khoảng thời gian</Typography.Text>
      <DatePicker.RangePicker
        className="w-full mt-2"
        value={dateRange}
        onChange={(range) => {
          const newRange = range as [Dayjs, Dayjs] | null;
          setDateRange(newRange);
          updateParams({
            start_date: newRange ? newRange[0].format("YYYY-MM-DD") : undefined,
            end_date: newRange ? newRange[1].format("YYYY-MM-DD") : undefined,
          });
          setPage(1);
        }}
        format="DD/MM/YYYY"
        placeholder={["Từ ngày", "Đến ngày"]}
      />

      <Divider />
      <Typography.Text strong>Loại tour</Typography.Text>
      {
        getTourCategoryApi.isLoading ? (<Skeleton/>) : (
          <Checkbox.Group
            className="flex flex-col gap-2 mt-2"
            value={tourTypes}
            onChange={(checked) => {
              const newTourTypes = checked as string[];
              setTourTypes(newTourTypes);
              updateParams({
                category_ids: newTourTypes.length > 0 ? newTourTypes.join(",") : undefined,
              });
              setPage(1);
            }}
          >
            {getTourCategoryApi.data?.data.map((category) => (
              <Checkbox key={category.id} value={category.id}>
                {category.category}
              </Checkbox>
            ))}
          </Checkbox.Group>

        )
      }
      <Divider />
      <Typography.Text strong>Vùng</Typography.Text>
      <Checkbox.Group
        className="flex flex-col gap-2 mt-2"
        value={regions}
        onChange={(checked) => {
          const newRegions = checked as string[];
          setRegions(newRegions);
          updateParams({
            regions: newRegions.length > 0 ? newRegions.join(",") : undefined,
          });
          setPage(1);
        }}
      >
        <Checkbox value="northern">Miền Bắc</Checkbox>
        <Checkbox value="central">Miền Trung</Checkbox>
        <Checkbox value="southern">Miền Nam</Checkbox>
      </Checkbox.Group>
      <Divider />
      <Checkbox
        checked={inStockOnly}
        onChange={(e) => {
          const checked = e.target.checked;
          setInStockOnly(checked);
          updateParams({
            stock: checked ? "1" : undefined,
          });
          setPage(1);
        }}
      >
        Chỉ hiển thị còn vé
      </Checkbox>

      <Divider />
      <Typography.Text strong>Tối thiểu {minRating} sao</Typography.Text>
      <Rate
        allowClear
        value={minRating}
        onChange={(val) => {
          const rating = val || 0;
          setMinRating(rating);
          updateParams({
            rating: rating > 0 ? String(rating) : undefined,
          });
        }}
      />

      <Divider />
    </>
  );
  return (
    <>
      <div
        className="h-[300px] md:h-[400px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="absolute inset-0 top-16 left-1/2 -translate-x-1/2 md:left-16 md:translate-x-0 flex flex-col gap-4 items-center md:items-start px-4">
          <Typography.Title level={2} className="!text-white text-center md:!text-left">
            Hãy bắt đầu hành trình đáng nhớ của bạn cùng chúng tôi.
          </Typography.Title>
          <Typography.Text className="!text-white text-center md:!text-left max-w-2xl">
            Khám phá những điểm đến tuyệt vời, trải nghiệm văn hóa độc đáo và tạo
            nên những kỷ niệm không thể nào quên.
          </Typography.Text>
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-4 relative -top-[40px] md:-top-[64px]">
        <div className="bg-white w-full shadow-md rounded-lg overflow-hidden flex">
          {/* Bộ lọc */}
          {screens.lg ? (
            <div className="p-4 w-[264px] h-full bg-white">
              {FilterContent}
            </div>
          ) : null}
          <Divider type="vertical" className="mx-0" />
          <div className="flex-1">
            <div className="bg-white flex flex-wrap gap-3 items-center justify-between px-4 md:px-6 py-4">
              <div className="flex-1 flex flex-col md:flex-row gap-2 order-2 md:order-1 w-full *:mb-0">
                <Input.Search
                  placeholder={'Tìm theo mã hoặc tên...'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onSearch={() => {
                    setSearchText(inputValue);
                    updateParams({
                      search: inputValue || undefined,
                      page: "1",
                    });
                    setPage(1);
                  }}
                  enterButton
                  loading={getToursApi.isLoading}
                />
              </div>

              <div className="flex items-center gap-2 order-1 md:order-2 w-full md:w-auto justify-between md:justify-end">
                {!screens.lg && (
                  <Button type="primary" icon={<BarsOutlined />} onClick={() => setIsFilterOpen(true)}>Bộ lọc</Button>
                )}
                <Button type="primary" onClick={handleClearFilter}>Xóa bộ lọc</Button>
              </div>
            </div>

            <Divider className="my-0" />

            <div className="bg-white p-4 md:p-6">
              <Row gutter={[16, 24]} justify="start">
                {getToursApi.isLoading ? (
                  <Col span={24}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Col>
                ) : getToursApi.isError ? (
                  <Col span={24}>
                    <Typography.Text type="danger">
                      Có lỗi xảy ra khi tải dữ liệu.
                    </Typography.Text>
                  </Col>
                ) : getToursApi.data?.data && getToursApi.data?.data?.length > 0 ? (
                  getToursApi.data?.data?.map((tour) => (
                    <Col key={tour.id} xl={6} lg={8} md={12} sm={24} xs={24}>
                      <TourCard tour={tour} onClick={() => navigate(`/detail/${tour.id}`)} />
                    </Col>
                  ))
                ) : (
                  <Col span={24}>
                    <Empty description="Không tìm thấy tour phù hợp."/>
                  </Col>
                )}
              </Row>
              {getToursApi.data?.data && getToursApi.data?.data?.length > 0 && getToursApi.data?.pagination ? (
                <Pagination
                  className="mt-5"
                  align="center"
                  current={page}
                  pageSize={limit}
                  showSizeChanger={false}
                  onChange={(page) => {
                      setPage(page)
                      updateParams({page, limit})
                    }
                  }
                  total={getToursApi.data.pagination.total || 0}
                />
              ) : null}
            </div>
          </div>
        </div>
        {!screens.lg && (
          <Drawer
            title="Bộ lọc"
            placement="left"
            open={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            width={320}
          >
            <div className="px-1">
              {FilterContent}
            </div>
          </Drawer>
        )}
      </div>
    </>
  );
};

export default ListTourPage;
