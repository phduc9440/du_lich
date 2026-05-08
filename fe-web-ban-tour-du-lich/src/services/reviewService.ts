import { useMutation, useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient";
import { queryClient } from "../configs/queryClient";

const getTopReviews = async () => {
  const res = await axiosClient.get("/reviews/top-5-star");
  return res.data;
};
const useGetTopReviewsQuery = () => {
  return useQuery({
    queryKey: ["topReviews"],
    queryFn: getTopReviews,
  });
};

const getTourReview = async (id, params) => {
  const res = await axiosClient.get(`/reviews/tour/${id}`, { params });
  return res.data;
};
const useGetTourReview = (id, params) => {
  return useQuery({
    queryKey: ["tourReview",id, params],
    queryFn: () => getTourReview(id, params),
  });
};

const createReview = async (payload) => {
  const res = await axiosClient.post("reviews", payload);
  return res;
};
const useCreateReview = () => {
  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"], exact:false });
      queryClient.refetchQueries({ queryKey: ["tourReview"], exact:false });
    },
  });
};

export { useGetTopReviewsQuery, useGetTourReview, useCreateReview };
