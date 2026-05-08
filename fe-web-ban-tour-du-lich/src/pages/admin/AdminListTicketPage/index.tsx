import { Empty, Input, Pagination, Skeleton, Typography } from "antd";
import TicketCard from "../../../components/TicketCard/index.tsx";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams.ts";
import { useAdminGetTicketsForTour } from "../../../services/adminService.ts";

const AdminListTicketPage: React.FC = () => {
    const {id} = useParams();
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 8));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return ({
            limit,
            page,
            text: searchText
        })
    }, [limit, page, searchText]);
    // call api
    const adminGetTicketsApi = useAdminGetTicketsForTour(Number(id),params);

    return (
        <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-4 space-y-4">
            <Typography.Title level={3}>Vé đã bán</Typography.Title>
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
                    loading={adminGetTicketsApi.isLoading} className="w-full sm:w-[360px]" />
            </div>
            {adminGetTicketsApi.data?.data.length === 0 && !adminGetTicketsApi.isLoading && (
                <Empty description="Chưa có vé nào được bán"/>
            )}
            {adminGetTicketsApi.isLoading ? (<Skeleton/>) : (
                adminGetTicketsApi.data?.data?.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                ))
            )}
            {adminGetTicketsApi.data?.data && adminGetTicketsApi.data?.data?.length > 0 && adminGetTicketsApi.data?.pagination ? (
                <Pagination
                    className="mt-5"
                    align="center"
                    current={page}
                    pageSize={limit}
                    onChange={(page) => {
                        setPage(page)
                        updateParams({ page, limit })
                    }
                    }
                    total={adminGetTicketsApi.data.pagination.total || 0}
                />
            ) : null}
        </div>
    );
};

export default AdminListTicketPage;
