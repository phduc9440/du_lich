import { useMutation, useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient";
import { queryClient } from "../configs/queryClient";
import type { GetOrdersResponse } from "../types/order";

// lấy đơn hàng của người dùng
const getOrders = async (params): Promise<GetOrdersResponse> => {
  const res = await axiosClient.get("/bookings/my-bookings", { params });
  return res.data;
};
const useGetOrdersQuery = (params) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
// lấy vé của người dùng
const getTickets = async (params) => {
  const res = await axiosClient.get("/tickets", { params });
  return res.data;
};
const useGetTicketsQuery = (params) => {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: () => getTickets(params),
  });
};
// tạo mới đơn hàng
const createOrder = async (payload) => {
  const res = await axiosClient.post("/bookings", payload);
  return res.data;
};
const useCreateOrder = () => {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"], exact: false });
      queryClient.refetchQueries({ queryKey: ["tickets"], exact: false });
      queryClient.refetchQueries({ queryKey: ["tours"], exact: false });
      queryClient.refetchQueries({ queryKey: ["detailTour"], exact: false });
    },
  });
};
export { useGetOrdersQuery, useGetTicketsQuery, useCreateOrder };
