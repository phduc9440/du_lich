import { useMutation, useQuery } from "@tanstack/react-query";
import axiosAdmin from "../configs/axiosAdmin";
import { queryClient } from "../configs/queryClient";
import axiosBase from "../configs/axiosBase";
import type { AdminGetUsersResponse } from "../types/user";
import type { AdminGetAdminsResponse } from "../types/admin";
import type { GetOrdersResponse } from "../types/order";
import type { GetTourCategoryResponse, GetTourDetailResponse } from "../types/tour";

const adminLogin = async (payload) => {
  const res = await axiosBase.post("/admin/auth/login", payload);
  return res.data;
};
const useAdminLogin = () => {
  return useMutation({
    mutationFn: adminLogin,
  });
};
// lấy profile admin
const adminGetProfile = async () => {
  const res = await axiosAdmin.get("/admin/auth/profile");
  return res.data;
};
// cập nhật profile admin
const adminUpdateProfile = async (payload) => {
  const res = await axiosAdmin.put("/admin/auth/profile", payload);
  return res.data;
};
const useAdminUpdateProfile = () => {
  return useMutation({
    mutationFn: adminUpdateProfile,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminProfile"] });
    },
  });
}
const useAdminGetProfile = () => {
  return useQuery({
    queryKey: ["adminProfile"],
    queryFn: adminGetProfile,
  });
};
// lấy danh sách khách hàng
const adminGetAllUser = async (params):Promise<AdminGetUsersResponse> => {
  const res = await axiosAdmin.get("/users", { params });
  return res.data;
};
const useAdminGetAllUser = (params) => {
  return useQuery({
    queryKey: ["adminAllUser", params],
    queryFn: () => adminGetAllUser(params),
  });
};
// lấy danh sách admin
const adminGetAllEmployee = async (params):Promise<AdminGetAdminsResponse> => {
  const res = await axiosAdmin.get("/admins/employees", { params });
  return res.data;
};
const useAdminGetAllEmployee = (params) => {
  return useQuery({
    queryKey: ["adminAllEmployee", params],
    queryFn: () => adminGetAllEmployee(params),
  });
};
// mở/khóa tài khoản khách hàng
const adminChangeStatusUser = async (payload) => {
  const res = await axiosAdmin.put(`/auth/users/status`, payload);
  return res.data;
};
const useAdminChangeStatusUser = () => {
  return useMutation({
    mutationFn: adminChangeStatusUser,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminAllUser"], exact: false });
    },
  });
};
// tạo tài khoản admin
const adminCreateAccout = async (payload) => {
  const res = await axiosAdmin.post(`/admin/auth/register`, payload);
  return res.data;
};
const useAdminCreateAccout = () => {
  return useMutation({
    mutationFn: adminCreateAccout,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminAllEmployee"], exact: false });
    },
  });
};
// khóa tài khoản nhân viên
const adminChangeStatusEmployee = async (payload) => {
  const res = await axiosAdmin.put(`/admins/change-status`, payload);
  return res.data;
}
const useAdminChangeStatusEmployee = () => {
  return useMutation({
    mutationFn: adminChangeStatusEmployee,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminAllEmployee"], exact: false });
      queryClient.refetchQueries({ queryKey: ["adminAllGuidesWithTourCount"], exact: false });
    }
  });
}
// đổi role nhân viên
const adminChangeRoleEmployee = async (payload) => {
  const res = await axiosAdmin.put(`/admins/change-role`, payload);
  return res.data;
}
const useAdminChangeRoleEmployee = () => {
  return useMutation({
    mutationFn: adminChangeRoleEmployee,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminAllEmployee"], exact: false });
    }
  });
};
// reset mật khẩu nhân viên
const adminResetPasswordEmployee = async (payload) => {
  const res = await axiosAdmin.put(`/admins/reset-password`, payload);
  return res.data;
}
const useAdminResetPasswordEmployee = () => {
  return useMutation({
    mutationFn: adminResetPasswordEmployee,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminAllEmployee"], exact: false });
    }
  });
};
// cập nhật region nhân viên
const adminChangeRegionEmployee = async (payload) => {
  const res = await axiosAdmin.put(`/admins/change-region`, payload);
  return res.data;
}
const useAdminChangeRegionEmployee = () => {
  return useMutation({
    mutationFn: adminChangeRegionEmployee,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminAllEmployee"], exact: false });
    }
  });
};
// lấy danh sách tour trang quản lý tour
const adminGetTours = async (params) => {
  const res = await axiosAdmin.get("/tours/admin", { params });
  return res.data;
};

const useAdminGetTours = (params) => {
  return useQuery({
    queryKey: ["adminTours", params],
    queryFn: () => adminGetTours(params),
    // Luôn enable vì params có thể là object rỗng {} nhưng vẫn hợp lệ (sẽ dùng default page, limit)
  });
};

// lấy danh sách tour số vé đã bán/tối đa
const adminGetToursQuantityTicket = async (params) => {
  const res = await axiosAdmin.get("/tours/admin/v2", { params });
  return res.data;
};

const useAdminGetToursQuantityTicket = (params) => {
  return useQuery({
    queryKey: ["adminTourQuantityTicket", params],
    queryFn: () => adminGetToursQuantityTicket(params),
    // Luôn enable vì params có thể là object rỗng {} nhưng vẫn hợp lệ (sẽ dùng default page, limit)
  });
};
// lấy danh mục tour
const adminGetTourCategory = async ():Promise<GetTourCategoryResponse> => {
  const res = await axiosAdmin.get("/categories");
  return res.data;
};
const useAdminGetCategory = () => {
  return useQuery({
    queryKey: ["adminTourCategory"],
    queryFn: adminGetTourCategory,
  });
};
// xóa cứng tour theo id
const adminHardDeleteTour = async (id: number) => {
  const res = await axiosAdmin.delete(`/tours/${id}/permanent`);
  return res.data;
};
const useAdminHardDeleteTour = () => {
  return useMutation({
    mutationFn: (id: number) => adminHardDeleteTour(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminTours"], exact: false });
    },
  });
};
// lấy chi tiết tour
const adminGetDetailTour = async (id: number):Promise<GetTourDetailResponse> => {
  const res = await axiosAdmin.get(`/tours/${id}`);
  return res.data;
};

const useAdminGetDetailTour = (id: number | undefined) => {
  return useQuery({
    queryKey: ["adminDetailTour", id],
    queryFn: () => adminGetDetailTour(id!),
    enabled: !!id, // Chỉ gọi API khi có id
  });
};

const adminUpdateTour = async (id: number, payload) => {
  const res = await axiosAdmin.put(`/tours/${id}`, payload);
  return res.data;
};
const useAdminUpdateTour = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload }) =>
      adminUpdateTour(id, payload),

    onSuccess: () => {
      // Invalidate danh sách tours
      queryClient.refetchQueries({ queryKey: ["adminTours"], exact: false});

      // Invalidate đúng detail tour
      queryClient.refetchQueries({ queryKey: ["adminDetailTour"], exact: false });
    },
  });
};

const adminCreateTour = async (payload) => {
  const res = await axiosAdmin.post("/tours", payload);
  return res.data;
};
const useAdminCreateTour = () => {
  return useMutation({
    mutationFn: adminCreateTour,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminTours"], exact: false, });
    },
  });
};

const adminCreateCategory = async (payload) => {
  const res = await axiosAdmin.post('/categories', payload);
  return res.data;
}
const useAdminCreateCategory = () => {
  return useMutation({
    mutationFn: adminCreateCategory,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminTourCategory"], exact:false });
    },
  })
}
const adminUpdateCategory = async (id:number, payload) => {
  const res = await axiosAdmin.put(`/categories/${id}`, payload);
  return res.data;
}
const useAdminUpdateCategory = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload }) => adminUpdateCategory(id, payload),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminTourCategory"], exact:false });
    },
  })
}
const adminDeleteCategory = async (id:number) => {
  const res = await axiosAdmin.delete(`/categories/${id}`);
  return res.data;
}
const useAdminDeleteCategory = () => {
  return useMutation({
    mutationFn: (id:number) => adminDeleteCategory(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminTourCategory"], exact: false });
    },
  })
}

const adminGetCoupons = async (params) => {
  const res = await axiosAdmin.get('/coupons', {params});
  return res.data;
}
const useAdminGetCoupons = (params) => {
  return useQuery({
    queryKey: ["adminCoupons", params],
    queryFn: () => adminGetCoupons(params)
  })
}

const adminCreateCoupon = async(payload) => {
  const res = await axiosAdmin.post("/coupons", payload);
  return res.data;
}
const useAdminCreateCoupon = () => {
  return useMutation({
    mutationFn: adminCreateCoupon,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminCoupons"], exact: false });
    },
  })
}
const adminUpdateCoupon = async(id:number, payload) => {
  const res = await axiosAdmin.put(`/coupons/${id}`, payload);
  return res.data;
}
const useAdminUpdateCoupon = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload }) => adminUpdateCoupon(id, payload),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminCoupons"], exact: false });
    },
  })
}
const adminDeleteCoupon = async(id:number) => {
  const res = await axiosAdmin.delete(`/coupons/${id}/delete-permanent`);
  return res.data;
}
const useAdminDeleteCoupon = () => {
  return useMutation({
    mutationFn: (id:number) => adminDeleteCoupon(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminCoupons"], exact: false });
    },
  })
}
// lấy danh sách đơn hàng
const adminGetOrders = async(params):Promise<GetOrdersResponse> => {
  const res = await axiosAdmin.get('/bookings', {params});
  return res.data;
}
const useAdminGetOrders = (params) => {
  return useQuery({
    queryKey: ["adminOrders", params],
    queryFn: () => adminGetOrders(params)
  })
}
const adminGetTicketsForTour = async(tourId:number, params) => {
  const res = await axiosAdmin.get(`/tickets/tour/${tourId}`, {params});
  return res.data;
}
const useAdminGetTicketsForTour = (tourId:number | undefined, params) => {
  return useQuery({
    queryKey: ["adminTicketsForTour", tourId, params],
    queryFn: () => adminGetTicketsForTour(tourId!, params),
    enabled: !!tourId, // Chỉ gọi API khi có tourId
  })
};
const adminCancelOrder = async(orderId:number) => {
  const res = await axiosAdmin.put(`/bookings/${orderId}/cancel`);
  return res.data;
}
const useAdminCancelOrder = () => {
  return useMutation({
    mutationFn: (orderId:number) => adminCancelOrder(orderId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["adminOrders"], exact: false });
      queryClient.refetchQueries({ queryKey: ["adminTicketsForTour"], exact: false });
    },
  })
}
const adminGetTicketsForOrder = async(orderId:number) => {
  const res = await axiosAdmin.get(`/tickets/order/${orderId}`);
  return res.data;
}
const useAdminGetTicketsForOrder = (orderId:number | undefined) => {
  return useQuery({
    queryKey: ["adminTicketsForOrder", orderId],
    queryFn: () => adminGetTicketsForOrder(orderId!),
    enabled: !!orderId, // Chỉ gọi API khi có orderId
  })
};
// admin lấy danh sách tour đã và đang được phân công cho hướng dẫn viên
const adminGetTourUpcoming = async(params) => {
  const res = await axiosAdmin.get('/tours/assigned/upcoming', {params});
  return res.data;
}
const useAdminGetTourUpcoming = (params) => {
  return useQuery({
    queryKey: ["adminTourUpcoming", params],
    queryFn: () => adminGetTourUpcoming(params),
  })
};
// admin lấy danh sách hướng dẫn viên được phân công cho tour trong khoảng thời gian
const adminGetGuideForTourUpcoming = async(tourId:number, startDate:string, endDate:string) => {
  const res = await axiosAdmin.get(`/tours/guides/by-dates/${tourId}/${startDate}/${endDate}`);
  return res.data;
}
const useAdminGetGuideForTourUpcoming = (tourId:number | undefined, startDate:string, endDate:string) => {
  return useQuery({
    queryKey: ["adminGuideForTourUpcoming", tourId, startDate, endDate],
    queryFn: () => adminGetGuideForTourUpcoming(tourId!, startDate, endDate),
    enabled: !!tourId, // Chỉ gọi API khi có tourId
  })
};
// hướng dẫn viên lấy danh sách tour được phân công
const guideGetToursAssigned = async(params) => {
  const res = await axiosAdmin.get('/tours/my-tours', {params});
  return res.data;
}
const useGuideGetToursAssigned = (params) => {
  return useQuery({
    queryKey: ["guideToursAssignedUp"],
    queryFn: () => guideGetToursAssigned(params),
  })
};
// hướng dẫn viên lấy danh sách đơn hàng theo tour được phân công trong khoảng thời gian
const guideGetOrdersForTour = async(tourId:number, startDate:string, endDate:string) => {
  const res = await axiosAdmin.get(`/tours/orders/by-tour/${tourId}/${startDate}/${endDate}`);
  return res.data;
}
const useGuideGetOrdersForTour = (tourId:number | undefined, startDate:string, endDate:string) => {
  return useQuery({
    queryKey: ["guideOrdersForTour", tourId, startDate, endDate],
    queryFn: () => guideGetOrdersForTour(tourId!, startDate, endDate),
    enabled: !!tourId, // Chỉ gọi API khi có tourId
  })
};

// Lấy danh sách tất cả guides với số tour hướng dẫn
const adminGetAllGuidesWithTourCount = async (params) => {
  const res = await axiosAdmin.get("/admins/guides", { params });
  return res.data;
};
const useAdminGetAllGuidesWithTourCount = (params) => {
  return useQuery({
    queryKey: ["adminAllGuidesWithTourCount", params],
    queryFn: () => adminGetAllGuidesWithTourCount(params),
  });
};
//admin Lấy tất cả tours mà guide đã và đang hướng dẫn
const adminGetToursByGuide = async (guideId: number, params) => {
  const res = await axiosAdmin.get(`/admins/guides/${guideId}/tours`, {params});
  return res.data;
};
const useAdminGetToursByGuide = (guideId: number | undefined, params) => {
  return useQuery({
    queryKey: ["adminToursByGuide", guideId],
    queryFn: () => adminGetToursByGuide(guideId!, params),
    enabled: !!guideId, // Chỉ gọi API khi có guideId
  });
};
// admin lấy đơn hàng của guide ứng với tour trong khoảng thời gian
const adminGetOrdersDivideForGuideWithTour = async (guideId, startDate, endDate, tourId) => {
  const res = await axiosAdmin.get(`/admins/guides/${guideId}/orders/${tourId}/${startDate}/${endDate}`);
  return res.data;
};
const useAdminGetOrdersDivideForGuideWithTour = (guideId, startDate, endDate, tourId) => {
  return useQuery({
    queryKey: ["adminOrdersDivideForGuideWithTour", guideId, startDate, endDate, tourId],
    queryFn: () => adminGetOrdersDivideForGuideWithTour(guideId!, startDate, endDate, tourId),
    enabled: !!guideId && !!startDate && !!endDate // Chỉ gọi API khi có guideId và ngày bắt đầu và kết thúc
  });
};

export {
  useAdminLogin,
  useAdminGetAllUser,
  useAdminGetAllEmployee,
  useAdminChangeStatusUser,
  useAdminCreateAccout,
  useAdminGetTours,
  useAdminGetCategory,
  useAdminHardDeleteTour,
  useAdminGetDetailTour,
  useAdminUpdateTour,
  useAdminCreateTour,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
  useAdminGetCoupons,
  useAdminCreateCoupon,
  useAdminUpdateCoupon,
  useAdminGetOrders,
  useAdminGetToursQuantityTicket,
  useAdminGetTicketsForTour,
  useAdminCancelOrder,
  useAdminGetTicketsForOrder,
  useAdminChangeStatusEmployee,
  useAdminChangeRoleEmployee,
  useAdminResetPasswordEmployee,
  useAdminGetTourUpcoming,
  useAdminGetGuideForTourUpcoming,
  useGuideGetToursAssigned,
  useGuideGetOrdersForTour,
  useAdminGetAllGuidesWithTourCount,
  useAdminGetToursByGuide,
  useAdminGetOrdersDivideForGuideWithTour,
  useAdminDeleteCoupon,
  useAdminGetProfile,
  useAdminUpdateProfile,
  useAdminChangeRegionEmployee,
};
