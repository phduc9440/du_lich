import { useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient"

const getNotifications = async () => {
    const res = await axiosClient.get('/notifications/user/get-noti');
    return res.data;
}

const useGetNotifications = (enabled: boolean) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled,
    retry: false,
  });
};


export {useGetNotifications}