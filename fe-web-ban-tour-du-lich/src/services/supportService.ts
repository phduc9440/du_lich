import { useMutation, useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient";
import { queryClient } from "../configs/queryClient";

const createFeedback = async (payload) => {
  const res = await axiosClient.post("/feedbacks/create-feedback", payload);
  return res.data;
}
const useCreateFeedback = () => {
    return useMutation({
        mutationFn: createFeedback,
    });
}

const getFeedbacks = async (params) => {
    const res = await axiosClient.get("/feedbacks/get-feedback", {params});
    return res.data;
}
const useGetFeedbacks = (params) => {
    return useQuery({
        queryKey: ['feedbacks', params],
        queryFn: () => getFeedbacks(params)
    });
}

const cancellFeedback = async (id) => {
    const res = await axiosClient.put(`/feedbacks/mark-cancelled/${id}`);
    return res.data;
}
const useCancellFeedback = () => {
    return useMutation({
        mutationFn: cancellFeedback,
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.refetchQueries({ queryKey: ["feedbacks"], exact: false });
        }
    });
}
export { useCreateFeedback, useGetFeedbacks, useCancellFeedback };