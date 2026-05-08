/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input, message, Modal, Skeleton } from "antd";
import OrderTable from "../../../components/OrderTable";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAdminCancelOrder, useAdminGetOrders, useAdminGetTicketsForOrder } from "../../../services/adminService";
import { useUpdateParams } from "../../../hooks/useUpdateParams";
import TicketCard from "../../../components/TicketCard";
const AdminOrderPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [sortOrderTicket, setSortOrderTicket] = useState<string | undefined>(searchParams.get('ticket_quantity') || undefined);
    const [sortOrderPrice, setSortOrderPrice] = useState<string | undefined>(searchParams.get('total_price') || undefined);
    const [status, setStatus] = useState(searchParams.get('status')?.split(",").filter(Boolean) || []);
    const [orderId, setOrderId] = useState<number | undefined>(undefined);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            page,
            limit,
            search: searchText || undefined,
            ticket: sortOrderTicket,
            total: sortOrderPrice,
            status: status.length > 0 ? status.join(",") : undefined,
        }
    }, [limit, page, searchText, sortOrderPrice, sortOrderTicket, status])
    // call api
    const adminGetOrdersApi = useAdminGetOrders(params);
    const adminCancelOrderApi = useAdminCancelOrder();
    const adminGetTicketsForOrderApi = useAdminGetTicketsForOrder(orderId);
    const handleShowTicket = async (orderId: number) => {
        setOrderId(orderId);
        try {
            await adminGetTicketsForOrderApi.refetch();
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
        }
    }
    const handleCancelOrder = async (orderId: number) => {
        try {
            await adminCancelOrderApi.mutateAsync(orderId);
            message.success("Hủy đơn hàng thành công.")
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
        }
    }

    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setStatus(filters?.status || []);
        const sortField = sorter?.field;
        if (sortField === 'quantity') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderTicket(sortOrder);
            setSortOrderPrice(undefined);
        } else if (sortField === 'total_price') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderPrice(sortOrder);
            setSortOrderTicket(undefined);
        } else {
            setSortOrderTicket(undefined);
            setSortOrderPrice(undefined);
        }
        updateParams({
            limit,
            page: pagination.current,
            status: filters?.status?.length > 0 ? filters?.status.join(",") : undefined,
            ticket: sortField === 'quantity' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
            total: sortField === 'total_price' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
        })
    };
    return (
        <div className="space-y-4 p-4 sm:p-5 bg-white rounded-lg shadow">
            <Input.Search placeholder="Nhập mã đơn ..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onSearch={() => {
                    setSearchText(inputValue);
                    setPage(1);
                    updateParams({
                        search: inputValue || undefined,
                        page: 1,
                    });
                }}
                enterButton
                loading={adminGetOrdersApi.isLoading}
            />

            <OrderTable orders={adminGetOrdersApi.data?.data || []} onTableChange={handleTableChange}
                pagination={{
                    page: page,
                    pageSize: limit,
                    total: adminGetOrdersApi.data?.pagination?.total || 0
                }}
                handleCancelOrder={handleCancelOrder}
                handleShowTicket={handleShowTicket}
            />
            <Modal
                title="Vé trong đơn hàng"
                open={!!orderId}
                footer={null}
                onCancel={() => setOrderId(undefined)}
                width={800}
                styles={{
                    body: {
                        maxHeight: 400,
                        overflowY: "auto",
                    },
                }}
            >
                {adminGetTicketsForOrderApi.isLoading ? (
                    <Skeleton />
                ) : (
                    <div className="space-y-2">
                        {adminGetTicketsForOrderApi.data?.data?.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default AdminOrderPage;