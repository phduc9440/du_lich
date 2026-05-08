import React, { useMemo, useState } from "react";
import { Empty, Input, message, Pagination, Segmented, Skeleton, } from "antd";
import OrderCard from "../../../components/OrderCard";
import { useGetOrdersQuery } from "../../../services/orderService";
import { useUpdateParams } from "../../../hooks/useUpdateParams";
import { useSearchParams } from "react-router-dom";
import { useCreateReview } from "../../../services/reviewService";

const OrderPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 8));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            limit,
            page,
            booking_status: status,
            search: searchText || undefined,
        }
    }, [limit, page, searchText, status]);
    // call api 
    const getOrdersApi = useGetOrdersQuery(params);
    const createReviewApi = useCreateReview();

    const handleCreateReview = async (dataReview) => {
        try {
            await createReviewApi.mutateAsync(dataReview);
            message.success("Đánh giá thành công");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error.response.data.message || "Đã có lỗi xảy ra vui lòng thử lại sau.");
        }
    }
    const handlePayment = (payment_url: string) => {
        // Lưu flag vào localStorage để biết tab thanh toán được mở từ window.open()
        localStorage.setItem('payment_tab_opened', 'true');
        window.open(payment_url, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-4 space-y-4">
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
                }}
                enterButton
                loading={getOrdersApi.isLoading}
            />
            <Segmented
                options={[
                    {
                        label: 'Tất cả',
                        value: 'all',
                    },
                    {
                        label: 'Chờ thanh toán',
                        value: 'pending',
                    },
                    {
                        label: 'Đã xác nhận',
                        value: 'confirmed',
                    },

                    {
                        label: 'Đã kết thúc',
                        value: 'completed',
                    },
                    {
                        label: 'Đã hủy',
                        value: 'canceled',
                    },
                ]}
                value={status}
                onChange={(value) => {
                    setStatus(value.toString());
                    updateParams({ booking_status: value })
                }}
                size="large"
                className="mb-4"
                block
            />
            {getOrdersApi.isLoading ? (<Skeleton />) : (
                getOrdersApi.data?.data?.length === 0 ? (<Empty description="Không có dữ liệu." />) : (
                    getOrdersApi.data?.data.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            handlePayment={handlePayment}
                            submitReview={handleCreateReview}
                        />
                    ))
                )
            )}
            {getOrdersApi.data?.data && getOrdersApi.data?.data?.length > 0 && getOrdersApi.data?.pagination ? (
                <Pagination
                    className="mt-5"
                    align="center"
                    current={page}
                    pageSize={limit}
                    showSizeChanger={false}
                    onChange={(page) => {
                        setPage(page)
                        updateParams({ page, limit })
                    }
                    }
                    total={getOrdersApi.data.pagination.total || 0}
                />
            ) : null}

        </div>
    )
}

export default OrderPage;