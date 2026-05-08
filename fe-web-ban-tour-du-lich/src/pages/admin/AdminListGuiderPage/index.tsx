import { Input } from "antd";
import ListGuiderTable from "../../../components/ListGuiderTable";
import { useUpdateParams } from "../../../hooks/useUpdateParams";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAdminGetAllGuidesWithTourCount } from "../../../services/adminService";

const AdminListGuiderPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [regions, setRegions] = useState(searchParams.get('regions')?.split(",").filter(Boolean) || []);
    const [sortOrderTour, setSortOrderTour] = useState<string | undefined>(searchParams.get('tour_quantity') || undefined);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            page,
            limit,
            search: searchText || undefined,
            regions: regions.length > 0 ? regions.join(",") : undefined,
            tour_quantity: sortOrderTour
        }
    }, [limit, page, regions, searchText, sortOrderTour])
    // call api
    const getGuideWithTourCountApi = useAdminGetAllGuidesWithTourCount(params);
    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setRegions(filters.region as string[] || []);
        const sortField = sorter?.field;
        if (sortField === 'toursNumber') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderTour(sortOrder);
        } else {
            setSortOrderTour(undefined);
        }
        updateParams({
            limit,
            page: pagination.current,
            regions: filters.region?.length > 0 ? filters.region.join(",") : undefined,
            tour_quantity: sortField === 'toursNumber' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
        })
    };
    return (
        <div className="p-4 sm:p-5 bg-white rounded-lg shadow space-y-4">
            <Input.Search placeholder="Tìm kiếm theo tên hoặc email..." value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onSearch={() => {
                    setSearchText(inputValue);
                    updateParams({
                        search: inputValue || undefined,
                    });
                }}
                enterButton />
            <ListGuiderTable data={getGuideWithTourCountApi.data?.data || []} pagination={{
                page: page,
                pageSize: limit,
                total: getGuideWithTourCountApi.data?.pagination.total || 0
            }} onTableChange={handleTableChange} />
        </div>
    )
}

export default AdminListGuiderPage;