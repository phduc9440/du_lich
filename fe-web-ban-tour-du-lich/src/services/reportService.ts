import { useQuery } from "@tanstack/react-query";
import axiosAdmin from "../configs/axiosAdmin";

// FE wrapper to call BE report endpoints
const getRevenueStats = async (params?: Record<string, unknown>) => {
  const res = await axiosAdmin.get("/admin/reports/revenue", { params });
  return res.data;
};

const useGetRevenueStats = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["reportRevenue", params],
    queryFn: () => getRevenueStats(params),
  });
};

const getTopTours = async (params?: Record<string, unknown>) => {
  const res = await axiosAdmin.get("/admin/reports/top-tours", { params });
  return res.data;
};

const useGetTopTours = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["reportTopTours", params],
    queryFn: () => getTopTours(params),
  });
};

const getTopRatedTours = async (params?: Record<string, unknown>) => {
  const res = await axiosAdmin.get("/admin/reports/top-rated-tours", { params });
  return res.data;
};

const useGetTopRatedTours = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["reportTopRatedTours", params],
    queryFn: () => getTopRatedTours(params),
  });
};

const getTopUsers = async (params?: Record<string, unknown>) => {
  const res = await axiosAdmin.get("/admin/reports/top-users", { params });
  return res.data;
};

const useGetTopUsers = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["reportTopUsers", params],
    queryFn: () => getTopUsers(params),
  });
};

export {
  useGetRevenueStats,
  useGetTopTours,
  useGetTopRatedTours,
  useGetTopUsers,
};
