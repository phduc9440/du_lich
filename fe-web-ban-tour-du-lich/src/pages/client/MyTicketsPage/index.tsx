import { Empty, Input, Pagination, Select, Skeleton, Typography } from "antd";
import TicketCard from "../../../components/TicketCard/index.tsx";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUserGetTicket } from "../../../services/ticketService.ts";
import { useUpdateParams } from "../../../hooks/useUpdateParams.ts";

const MyTicketsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [ticketStatus, setTicketStatus] = useState(searchParams.get('') || 'active');
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 8));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return ({
            limit,
            page,
            type: ticketStatus,
            text: searchText
        })
    }, [limit, page, searchText, ticketStatus]);
    // call api
    const getTicketsApi = useUserGetTicket(params);

    return (
        <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-4 space-y-4">
            <Typography.Title level={3}>Vé của tôi</Typography.Title>
            <div className="flex flex-wrap gap-3 items-center">
                <Input.Search placeholder="Nhập mã tour"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onSearch={() => {
                        setSearchText(inputValue);
                        updateParams({
                            text: inputValue || undefined,
                        });
                    }}
                    enterButton
                    loading={getTicketsApi.isLoading} className="w-full sm:w-[360px]" />
                <Select
                    className="w-[140px]"
                    value={ticketStatus}
                    options={[
                        { label: 'Còn hạn', value: 'active' },
                        { label: 'Hết hạn', value: 'used' },
                        { label: 'Đã hủy', value: 'cancelled' }
                    ]}
                    onChange={(value) => {
                        setTicketStatus(value);
                        updateParams({ type: value })
                    }}
                />
            </div>
            {getTicketsApi.isLoading ? (<Skeleton/>) : (
                getTicketsApi.data?.data?.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                ))
            )}
            {getTicketsApi.data?.data?.length === 0 && !getTicketsApi.isLoading ? (
                <Empty description="Không có vé nào." />
            ) : null}
            {getTicketsApi.data?.data && getTicketsApi.data?.data?.length > 0 && getTicketsApi.data?.pagination ? (
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
                    total={getTicketsApi.data.pagination.total || 0}
                />
            ) : null}
        </div>
    );
};

export default MyTicketsPage;
