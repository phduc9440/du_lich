import axiosClient from "../configs/axiosClient";
import { useQuery } from "@tanstack/react-query";
import {
  type GetTourCategoryResponse,
  type GetTourDetailResponse,
  type GetToursResponse,
} from "../types/tour";

const getTours = async (params): Promise<GetToursResponse> => {
  const res = await axiosClient.get("/tours", { params });

  return res.data;
};

export const useGetToursQuery = (params) => {
  return useQuery({
    queryKey: ["tours", params],
    queryFn: () => getTours(params),
    // Luôn enable vì params có thể là object rỗng {} nhưng vẫn hợp lệ (sẽ dùng default page, limit)
  });
};

const getDetailTour = async (id: number): Promise<GetTourDetailResponse> => {
  const res = await axiosClient.get(`/tours/${id}`);
  return res.data;
};

export const useGetDetailTour = (id: number | undefined) => {
  return useQuery({
    queryKey: ["detailTour", id],
    queryFn: () => getDetailTour(id!),
    enabled: !!id, // Chỉ gọi API khi có id
  });
};

const getToursPopular = async () => {
  const res = await axiosClient.get("/tours/featured?limit=10");
  return res.data;
};
export const useGetToursPopular = () => {
  return useQuery({
    queryKey: ["toursPopular"],
    queryFn: getToursPopular,
  });
};

const getTourGallery = async () => {
  const res = await axiosClient.get("/tours/gallery/destinations");
  return res.data;
};
export const useGetTourGallery = () => {
  return useQuery({
    queryKey: ["tourGallery"],
    queryFn: getTourGallery,
  });
};

const getToursSuggested = async () => {
  const res = await axiosClient.get("/tours/most-booked?limit=8");
  return res.data;
};
export const useGetToursSuggested = () => {
  return useQuery({
    queryKey: ["toursSuggested"],
    queryFn: getToursSuggested,
  });
};

const getTourCategory = async ():Promise<GetTourCategoryResponse> => {
  const res = await axiosClient.get("/categories");
  return res.data;
};
export const useGetCategory = () => {
  return useQuery({
    queryKey: ["tourCategory"],
    queryFn: getTourCategory,
  });
};
