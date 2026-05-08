import { useMutation, useQuery } from "@tanstack/react-query";
import axiosClient from "../configs/axiosClient";
import { queryClient } from "../configs/queryClient";
import axiosBase from "../configs/axiosBase";
import type { GetUserProfileResponse } from "../types/user";

// login
const loginUser = async (payload) => {
  const res = await axiosBase.post("/auth/login", payload);
  return res.data;
};
const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

// google login
const googleLoginUser = async (payload) => {
  const res = await axiosBase.post("/auth/google-login", payload);
  return res.data;
};
const useGoogleLoginMutation = () => {
  return useMutation({
    mutationFn: googleLoginUser,
  });
};

// register
const register = async (payload) => {
  const res = await axiosBase.post("/auth/register", payload);
  return res.data;
};
const useRegisterMutation = () => {
  return useMutation({
    mutationFn: register,
  });
};

// đổi mật khẩu
const changePassword = async (payload) => {
  const res = await axiosClient.put("/auth/change-password", payload);
  return res.data;
};
const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};

// quên mật khẩu
const forgotPassword = async (payload) => {
  const res = await axiosBase.post("/auth/forgot-password", payload);
  return res.data;
};
const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: forgotPassword,
  });
};
// đặt lại mật khẩu
const resetPassword = async (payload) => {
  const res = await axiosBase.post("/auth/reset-password", payload);
  return res.data;
};
const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: resetPassword,
  });
}

// lấy thông tin cá nhân
const getProfile = async ():Promise<GetUserProfileResponse> => {
  const res = await axiosClient.get("/auth/me");
  return res.data;
};
const useGetProfileQuery = () => {
  return useQuery({
    queryKey:['userProfile'],
    queryFn: getProfile
  })
}

// cập nhật thông tin cá nhân
const updateProfile = async (payload) => {
  const res = await axiosClient.put("/auth/profile", payload);
  return res.data;
}
const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  })
}

export {
  useLoginMutation,
  useGoogleLoginMutation,
  useRegisterMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useResetPasswordMutation
};
