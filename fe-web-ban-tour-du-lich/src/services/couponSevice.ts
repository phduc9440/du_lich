import { useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient";

const getCoupon = async () => {
  const res = await axiosClient.get("/coupons");
  return res.data;
};
const useGetCoupon = () => {
  return useQuery({
    queryKey: ["coupon"],
    queryFn: getCoupon,
  });
};

export { useGetCoupon };
