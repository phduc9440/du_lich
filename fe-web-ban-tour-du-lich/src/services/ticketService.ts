import { useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient"
import type { GetTicketsResponse } from "../types/ticket";

const userGetTickets = async (params):Promise<GetTicketsResponse> => {
    const res = await axiosClient.get('tickets/my-tickets', {params})
    return res.data;
}
const useUserGetTicket = (params) => {
    return useQuery({
        queryKey: ['userTickets', params],
        queryFn: () => userGetTickets(params),
        refetchOnMount: 'always',
    })
}

export {useUserGetTicket}