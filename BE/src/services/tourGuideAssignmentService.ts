import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';
import Tour from '../models/Tour';
import Admin from '../models/Admin';
import TourGuide from '../models/TourGuide';
import Order from '../models/Order';
import User from '../models/User';

interface GuideAssignmentInfo {
  guide: Admin;
  ticketCount: number; // Tổng số vé (quantity) đã được phân cho guide
  earliestAvailableDate: Date | null;
  hasOverlappingTours: boolean;
  overlappingTourInfo?: { tour_id: number; start_date: string; end_date: string } | null; // Thông tin tour trùng lịch
}

class TourGuideAssignmentService {
  /**
   * Kiểm tra xem hai khoảng thời gian có trùng nhau không
   */
  private datesOverlap(
    start1: Date | string,
    end1: Date | string,
    start2: Date | string,
    end2: Date | string
  ): boolean {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);

    // Trùng nhau nếu: start1 <= end2 && start2 <= end1
    return s1 <= e2 && s2 <= e1;
  }

  /**
   * Lấy thông tin về các tour đã được phân công của guide
   */
  private async getGuideAssignments(guideId: number): Promise<TourGuide[]> {
    return await TourGuide.findAll({
      where: {
        guide_id: guideId,
      },
      order: [['end_date', 'DESC']],
    });
  }

  /**
   * Kiểm tra guide có tour nào trùng lịch với tour mới không
   * Trả về thông tin tour trùng lịch nếu có
   */
  private hasOverlappingTours(
    guideAssignments: TourGuide[],
    newTourStartDate: Date | string,
    newTourEndDate: Date | string
  ): { hasOverlap: boolean; overlappingTour?: { tour_id: number; start_date: string; end_date: string } } {
    const overlappingAssignment = guideAssignments.find((assignment) =>
      this.datesOverlap(
        assignment.start_date,
        assignment.end_date,
        newTourStartDate,
        newTourEndDate
      )
    );

    if (overlappingAssignment) {
      // Chuyển đổi Date sang string format YYYY-MM-DD nếu cần
      const startDateStr = typeof overlappingAssignment.start_date === 'string' 
        ? overlappingAssignment.start_date 
        : new Date(overlappingAssignment.start_date).toISOString().split('T')[0];
      const endDateStr = typeof overlappingAssignment.end_date === 'string' 
        ? overlappingAssignment.end_date 
        : new Date(overlappingAssignment.end_date).toISOString().split('T')[0];
      
      return {
        hasOverlap: true,
        overlappingTour: {
          tour_id: overlappingAssignment.tour_id,
          start_date: startDateStr,
          end_date: endDateStr,
        },
      };
    }

    return { hasOverlap: false };
  }

  /**
   * Tìm ngày rảnh sớm nhất của guide (end_date của tour cuối cùng)
   */
  private getEarliestAvailableDate(guideAssignments: TourGuide[]): Date | null {
    if (guideAssignments.length === 0) {
      return null; // Guide chưa có tour nào, rảnh ngay
    }

    // Sắp xếp theo end_date giảm dần, lấy tour có end_date muộn nhất
    const sortedAssignments = [...guideAssignments].sort(
      (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    );

    return new Date(sortedAssignments[0].end_date);
  }

  /**
   * Tính tổng số vé (quantity) đã được phân cho guide (chỉ tính các đơn confirmed/completed)
   * Mỗi vé là 1 người dùng, nên tính tổng quantity thay vì đếm số đơn
   */
  private async getGuideTicketCount(guideId: number): Promise<number> {
    const orders = await Order.findAll({
      where: {
        guide_id: guideId,
        status: { [Op.in]: ['confirmed', 'completed'] },
      },
      attributes: ['quantity'],
    });

    // Tính tổng quantity (tổng số vé) từ tất cả orders
    const totalTickets = orders.reduce((sum, order) => {
      const quantity = order.getDataValue ? order.getDataValue('quantity') : order.quantity;
      return sum + (quantity || 0);
    }, 0);

    return totalTickets;
  }

  /**
   * Thuật toán tham lam phân công guide cho tour
   * @param tourId - ID của tour
   * @param startDate - Ngày bắt đầu (optional, nếu không có thì dùng tour.start_date)
   * @param endDate - Ngày kết thúc (optional, nếu không có thì dùng tour.end_date)
   */
  async assignGuideToTour(
    tourId: number, 
    startDate?: Date | string, 
    endDate?: Date | string
  ): Promise<{ guide: Admin; tourGuide: TourGuide }> {
    // 1. Lấy thông tin tour
    const tour = await Tour.findByPk(tourId);
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    // Sử dụng startDate/endDate từ tham số hoặc từ tour
    // Chuyển đổi sang string format YYYY-MM-DD cho database DATEONLY
    let tourStartDate: string;
    let tourEndDate: string;
    
    if (startDate) {
      tourStartDate = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString().split('T')[0];
    } else if (tour.start_date) {
      tourStartDate = typeof tour.start_date === 'string' ? tour.start_date : new Date(tour.start_date).toISOString().split('T')[0];
    } else {
      throw new Error('Tour phải có start_date hoặc cần cung cấp startDate');
    }

    if (endDate) {
      tourEndDate = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString().split('T')[0];
    } else if (tour.end_date) {
      tourEndDate = typeof tour.end_date === 'string' ? tour.end_date : new Date(tour.end_date).toISOString().split('T')[0];
    } else {
      throw new Error('Tour phải có end_date hoặc cần cung cấp endDate');
    }

    const tourRegion = tour.region || 'northern';
    const tourStartDateObj = new Date(tourStartDate);
    const tourEndDateObj = new Date(tourEndDate);

    // 2. Lấy tất cả guides đang active
    const allGuides = await Admin.findAll({
      where: {
        role: 'guide',
        is_active: true,
      },
    });

    if (allGuides.length === 0) {
      throw new Error('Không có guide nào khả dụng');
    }

    // 3. Phân loại guides theo region
    const guidesInSameRegion = allGuides.filter(
      (guide) => (guide.region || 'northern') === tourRegion
    );
    const guidesInOtherRegions = allGuides.filter(
      (guide) => (guide.region || 'northern') !== tourRegion
    );

    // 4. Thu thập thông tin về assignments của từng guide
    const guideInfos: GuideAssignmentInfo[] = [];

    // Xử lý guides cùng region trước
    for (const guide of guidesInSameRegion) {
      const assignments = await this.getGuideAssignments(guide.id);
      const overlapResult = this.hasOverlappingTours(
        assignments,
        tourStartDateObj,
        tourEndDateObj
      );
      const earliestAvailable = this.getEarliestAvailableDate(assignments);
      // Tính tổng số vé (quantity) đã được phân cho guide này
      const ticketCount = await this.getGuideTicketCount(guide.id);

      // Log thông tin nếu guide có tour trùng lịch
      if (overlapResult.hasOverlap && overlapResult.overlappingTour) {
        console.log(`⚠️ [Guide Assignment] Guide ID ${guide.id} (${guide.username}) đang có tour trùng lịch:`, {
          guide_id: guide.id,
          guide_username: guide.username,
          overlapping_tour_id: overlapResult.overlappingTour.tour_id,
          overlapping_start_date: overlapResult.overlappingTour.start_date,
          overlapping_end_date: overlapResult.overlappingTour.end_date,
          new_tour_id: tourId,
          new_tour_start_date: tourStartDate,
          new_tour_end_date: tourEndDate,
          message: 'Guide không thể hướng dẫn 2 tour cùng lúc'
        });
      }

      guideInfos.push({
        guide,
        ticketCount: ticketCount,
        earliestAvailableDate: earliestAvailable,
        hasOverlappingTours: overlapResult.hasOverlap,
        overlappingTourInfo: overlapResult.overlappingTour || null,
      });
    }

    // Xử lý guides khác region
    for (const guide of guidesInOtherRegions) {
      const assignments = await this.getGuideAssignments(guide.id);
      const overlapResult = this.hasOverlappingTours(
        assignments,
        tourStartDateObj,
        tourEndDateObj
      );
      const earliestAvailable = this.getEarliestAvailableDate(assignments);
      // Tính tổng số vé (quantity) đã được phân cho guide này
      const ticketCount = await this.getGuideTicketCount(guide.id);

      // Log thông tin nếu guide có tour trùng lịch
      if (overlapResult.hasOverlap && overlapResult.overlappingTour) {
        console.log(`⚠️ [Guide Assignment] Guide ID ${guide.id} (${guide.username}) đang có tour trùng lịch:`, {
          guide_id: guide.id,
          guide_username: guide.username,
          overlapping_tour_id: overlapResult.overlappingTour.tour_id,
          overlapping_start_date: overlapResult.overlappingTour.start_date,
          overlapping_end_date: overlapResult.overlappingTour.end_date,
          new_tour_id: tourId,
          new_tour_start_date: tourStartDate,
          new_tour_end_date: tourEndDate,
          message: 'Guide không thể hướng dẫn 2 tour cùng lúc'
        });
      }

      guideInfos.push({
        guide,
        ticketCount: ticketCount,
        earliestAvailableDate: earliestAvailable,
        hasOverlappingTours: overlapResult.hasOverlap,
        overlappingTourInfo: overlapResult.overlappingTour || null,
      });
    }

    // 5. Áp dụng thuật toán tham lam
    let selectedGuide: Admin | null = null;

    // Ưu tiên 1: Guides cùng region
    if (guidesInSameRegion.length > 0) {
      // Priority 1: Guide có ít vé nhất (tổng quantity) và không trùng lịch
      const availableInSameRegion = guideInfos
        .filter(
          (info) =>
            guidesInSameRegion.some((g) => g.id === info.guide.id) &&
            !info.hasOverlappingTours
        )
        .sort((a, b) => {
          // Nếu ticketCount khác nhau, sort theo ticketCount (ít vé nhất trước)
          if (a.ticketCount !== b.ticketCount) {
            return a.ticketCount - b.ticketCount;
          }
          // Nếu ticketCount bằng nhau, sort theo earliestAvailableDate (sớm nhất trước)
          // Guides chưa có tour nào (null) được ưu tiên trước
          if (a.earliestAvailableDate === null && b.earliestAvailableDate !== null) return -1;
          if (a.earliestAvailableDate !== null && b.earliestAvailableDate === null) return 1;
          if (a.earliestAvailableDate === null && b.earliestAvailableDate === null) return 0;
          // Nếu cả hai đều có date, sắp xếp theo date tăng dần (sớm nhất trước)
          return (
            new Date(a.earliestAvailableDate!).getTime() -
            new Date(b.earliestAvailableDate!).getTime()
          );
        });

      if (availableInSameRegion.length > 0) {
        selectedGuide = availableInSameRegion[0].guide;
      } else {
        // Priority 2: Guide rảnh sớm nhất (end_date < tour.start_date) hoặc chưa có tour nào
        // KHÔNG được chọn guide có tour trùng lịch
        const freeGuides = guideInfos
          .filter(
            (info) =>
              guidesInSameRegion.some((g) => g.id === info.guide.id) &&
              !info.hasOverlappingTours && // Không được trùng lịch
              (info.earliestAvailableDate === null ||
                new Date(info.earliestAvailableDate) < tourStartDateObj)
          )
          .sort((a, b) => {
            // Guides chưa có tour nào (null) được ưu tiên trước
            if (a.earliestAvailableDate === null && b.earliestAvailableDate !== null) return -1;
            if (a.earliestAvailableDate !== null && b.earliestAvailableDate === null) return 1;
            if (a.earliestAvailableDate === null && b.earliestAvailableDate === null) return 0;
            // Nếu cả hai đều có date, sắp xếp theo date tăng dần
            return (
              new Date(a.earliestAvailableDate!).getTime() -
              new Date(b.earliestAvailableDate!).getTime()
            );
          });

        if (freeGuides.length > 0) {
          selectedGuide = freeGuides[0].guide;
        }
      }
    }

    // Nếu không tìm được guide cùng region, tìm trong tất cả guides
    if (!selectedGuide) {
      // Priority 1: Guide có ít vé nhất (tổng quantity) và không trùng lịch
      const availableGuides = guideInfos
        .filter((info) => !info.hasOverlappingTours)
        .sort((a, b) => {
          // Nếu ticketCount khác nhau, sort theo ticketCount (ít vé nhất trước)
          if (a.ticketCount !== b.ticketCount) {
            return a.ticketCount - b.ticketCount;
          }
          // Nếu ticketCount bằng nhau, sort theo earliestAvailableDate (sớm nhất trước)
          // Guides chưa có tour nào (null) được ưu tiên trước
          if (a.earliestAvailableDate === null && b.earliestAvailableDate !== null) return -1;
          if (a.earliestAvailableDate !== null && b.earliestAvailableDate === null) return 1;
          if (a.earliestAvailableDate === null && b.earliestAvailableDate === null) return 0;
          // Nếu cả hai đều có date, sắp xếp theo date tăng dần (sớm nhất trước)
          return (
            new Date(a.earliestAvailableDate!).getTime() -
            new Date(b.earliestAvailableDate!).getTime()
          );
        });

      if (availableGuides.length > 0) {
        selectedGuide = availableGuides[0].guide;
      } else {
        // Priority 2: Guide rảnh sớm nhất hoặc chưa có tour nào
        // KHÔNG được chọn guide có tour trùng lịch
        const freeGuides = guideInfos
          .filter(
            (info) =>
              !info.hasOverlappingTours && // Không được trùng lịch
              (info.earliestAvailableDate === null ||
                new Date(info.earliestAvailableDate) < tourStartDateObj)
          )
          .sort((a, b) => {
            // Guides chưa có tour nào (null) được ưu tiên trước
            if (a.earliestAvailableDate === null && b.earliestAvailableDate !== null) return -1;
            if (a.earliestAvailableDate !== null && b.earliestAvailableDate === null) return 1;
            if (a.earliestAvailableDate === null && b.earliestAvailableDate === null) return 0;
            // Nếu cả hai đều có date, sắp xếp theo date tăng dần
            return (
              new Date(a.earliestAvailableDate!).getTime() -
              new Date(b.earliestAvailableDate!).getTime()
            );
          });

        if (freeGuides.length > 0) {
          selectedGuide = freeGuides[0].guide;
        }
      }
    }

    // 6. Nếu vẫn không tìm được, log thông tin và ném lỗi
    if (!selectedGuide) {
      // Log thông tin các guides có tour trùng lịch
      const guidesWithOverlap = guideInfos.filter(info => info.hasOverlappingTours);
      if (guidesWithOverlap.length > 0) {
        console.log(`❌ [Guide Assignment] Không tìm được guide phù hợp cho tour ${tourId}:`, {
          tour_id: tourId,
          tour_start_date: tourStartDate,
          tour_end_date: tourEndDate,
          total_guides: guideInfos.length,
          guides_with_overlapping_tours: guidesWithOverlap.map(info => ({
            guide_id: info.guide.id,
            guide_username: info.guide.username,
            overlapping_tour_info: info.overlappingTourInfo,
            ticket_count: info.ticketCount,
          })),
          message: 'Tất cả guides đều đã có tour trùng lịch hoặc không rảnh trước ngày bắt đầu tour'
        });
      }
      
      throw new Error(
        'Không tìm được guide phù hợp. Tất cả guides đều đã có tour trùng lịch hoặc không rảnh trước ngày bắt đầu tour.'
      );
    }

    // Log thông tin guide được chọn
    const selectedGuideInfo = guideInfos.find(info => info.guide.id === selectedGuide.id);
    console.log(`✅ [Guide Assignment] Đã chọn guide cho tour ${tourId}:`, {
      tour_id: tourId,
      tour_start_date: tourStartDate,
      tour_end_date: tourEndDate,
      guide_id: selectedGuide.id,
      guide_username: selectedGuide.username,
      guide_region: selectedGuide.region,
      ticket_count: selectedGuideInfo?.ticketCount || 0,
      has_overlapping_tours: selectedGuideInfo?.hasOverlappingTours || false,
      message: 'Phân công thành công'
    });

    // 7. Kiểm tra xem tour đã có guide chưa (theo tour_id, start_date, end_date)
    const existingAssignment = await TourGuide.findOne({
      where: {
        tour_id: tourId,
        start_date: tourStartDate, // string format YYYY-MM-DD
        end_date: tourEndDate, // string format YYYY-MM-DD
      },
    });

    if (existingAssignment) {
      // Cập nhật assignment hiện có trong bảng tour_guides
      await existingAssignment.update({
        guide_id: selectedGuide.id,
        start_date: tourStartDate as any, // string format YYYY-MM-DD
        end_date: tourEndDate as any, // string format YYYY-MM-DD
      });
      await existingAssignment.reload({ include: [{ model: Admin, as: 'guide' }] });
      return {
        guide: selectedGuide,
        tourGuide: existingAssignment,
      };
    } else {
      // Tạo assignment mới trong bảng tour_guides
      const tourGuide = await TourGuide.create({
        tour_id: tourId,
        guide_id: selectedGuide.id,
        start_date: tourStartDate as any, // string format YYYY-MM-DD
        end_date: tourEndDate as any, // string format YYYY-MM-DD
      });
      await tourGuide.reload({ include: [{ model: Admin, as: 'guide' }] });
      return {
        guide: selectedGuide,
        tourGuide,
      };
    }
  }

  /**
   * Kiểm tra xem có guide nào còn rảnh (không trùng lịch) cho khoảng thời gian này không
   * @param startDate - Ngày bắt đầu tour
   * @param endDate - Ngày kết thúc tour
   * @param excludeTourId - ID tour cần loại trừ khi kiểm tra (dùng cho update tour)
   * @returns true nếu có ít nhất 1 guide rảnh, false nếu không có guide nào rảnh
   */
  async checkAvailableGuidesForDates(
    startDate: Date | string,
    endDate: Date | string,
    excludeTourId?: number
  ): Promise<boolean> {
    try {
      // Chuyển đổi sang Date object nếu cần
      const tourStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const tourEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;

      // Lấy tất cả guides đang active
      const allGuides = await Admin.findAll({
        where: {
          role: 'guide',
          is_active: true,
        },
      });

      if (allGuides.length === 0) {
        return false; // Không có guide nào
      }

      // Kiểm tra từng guide xem có rảnh không
      for (const guide of allGuides) {
        // Lấy tất cả assignments của guide
        const guideAssignments = await this.getGuideAssignments(guide.id);

        // Kiểm tra xem guide có tour nào trùng lịch không
        const hasOverlap = guideAssignments.some((assignment) => {
          // Nếu có excludeTourId, bỏ qua assignment của tour đó (dùng cho update)
          if (excludeTourId && assignment.tour_id === excludeTourId) {
            return false;
          }
          
          return this.datesOverlap(
            assignment.start_date,
            assignment.end_date,
            tourStartDate,
            tourEndDate
          );
        });

        // Nếu guide không có tour trùng lịch, thì guide này rảnh
        if (!hasOverlap) {
          return true; // Có ít nhất 1 guide rảnh
        }

        // Nếu guide có tour trùng lịch, kiểm tra xem guide có rảnh trước ngày bắt đầu tour không
        if (guideAssignments.length > 0) {
          // Sắp xếp theo end_date giảm dần, lấy tour có end_date muộn nhất
          const sortedAssignments = [...guideAssignments]
            .filter(assignment => {
              // Nếu có excludeTourId, bỏ qua assignment của tour đó
              if (excludeTourId && assignment.tour_id === excludeTourId) {
                return false;
              }
              return true;
            })
            .sort(
              (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
            );

          if (sortedAssignments.length > 0) {
            const latestEndDate = new Date(sortedAssignments[0].end_date);
            // Nếu tour cuối cùng kết thúc trước ngày bắt đầu tour mới, thì guide rảnh
            if (latestEndDate < tourStartDate) {
              return true; // Guide rảnh trước ngày bắt đầu tour
            }
          } else {
            // Nếu tất cả assignments đều bị loại trừ (excludeTourId), guide rảnh
            return true;
          }
        } else {
          // Guide chưa có tour nào, rảnh ngay
          return true;
        }
      }

      return false; // Không có guide nào rảnh
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra guide rảnh:', error.message);
      // Nếu có lỗi, trả về false để an toàn (không cho tạo/cập nhật tour)
      return false;
    }
  }

  /**
   * Lấy danh sách guides có thể phân công cho tour (để preview)
   */
  async getAvailableGuidesForTour(tourId: number): Promise<any[]> {
    const tour = await Tour.findByPk(tourId);
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    if (!tour.start_date || !tour.end_date) {
      throw new Error('Tour phải có start_date và end_date');
    }

    const tourRegion = tour.region || 'northern';
    const tourStartDate = new Date(tour.start_date);
    const tourEndDate = new Date(tour.end_date);

    const allGuides = await Admin.findAll({
      where: {
        role: 'guide',
        is_active: true,
      },
    });

    const guideInfos = [];

    for (const guide of allGuides) {
      const assignments = await this.getGuideAssignments(guide.id);
      const overlapResult = this.hasOverlappingTours(
        assignments,
        tourStartDate,
        tourEndDate
      );
      const earliestAvailable = this.getEarliestAvailableDate(assignments);
      const isSameRegion = (guide.region || 'northern') === tourRegion;
      // Tính tổng số vé (quantity) đã được phân cho guide này
      const ticketCount = await this.getGuideTicketCount(guide.id);

      guideInfos.push({
        guide: {
          id: guide.id,
          username: guide.username,
          email: guide.email,
          region: guide.region || 'northern',
        },
        ticketCount: ticketCount,
        earliestAvailableDate: earliestAvailable,
        hasOverlappingTours: overlapResult.hasOverlap,
        overlappingTourInfo: overlapResult.overlappingTour || null,
        isSameRegion,
        canAssign: !overlapResult.hasOverlap || (earliestAvailable === null || new Date(earliestAvailable) < tourStartDate),
      });
    }

    // Sắp xếp: cùng region trước, sau đó theo số lượng vé (ticketCount)
    guideInfos.sort((a, b) => {
      if (a.isSameRegion !== b.isSameRegion) {
        return a.isSameRegion ? -1 : 1;
      }
      return a.ticketCount - b.ticketCount;
    });

    return guideInfos;
  }

  /**
   * Lấy danh sách tour đã phân công từ bảng tour_guides (bao gồm cả quá khứ)
   */
  async getAssignedToursWithUpcomingStartDate(
    page: number = 1, 
    limit: number = 10,
    search?: string,
    regions?: string[],
    startDate?: string,
    endDate?: string,
    status?: string,
    startDateSort?: string,
    endDateSort?: string,
    quantityClientSort?: string
  ): Promise<any> {
    const offset = (page - 1) * limit;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const currentDateStr = currentDate.toISOString().split('T')[0];

    // Build where clause cho Tour - không filter is_active để lấy tất cả
    const tourWhere: any = {};

    // Filter theo search (tìm theo mã tour)
    if (search) {
      tourWhere.tour_code = { [Op.like]: `%${search}%` };
    }

    // Filter theo regions
    if (regions && regions.length > 0) {
      tourWhere.region = { [Op.in]: regions };
    }

    // Filter theo status (active/inactive)
    if (status === 'active') {
      // active: end_date >= current_time
      tourWhere.end_date = { [Op.gte]: currentDateStr };
    } else if (status === 'inactive') {
      // inactive: những tour còn lại (end_date < current_time)
      tourWhere.end_date = { [Op.lt]: currentDateStr };
    }

    // Filter theo thời gian (start_date và end_date của tour) - không dùng nữa, chỉ dùng để sort
    // if (startDate || endDate) { ... }

    // Lấy danh sách tour đã phân công từ bảng tour_guides (lấy tất cả kể cả quá khứ)
    // Lấy tất cả để có thể sort đúng trước khi paginate
    const { count, rows } = await TourGuide.findAndCountAll({
      include: [
        {
          model: Tour,
          as: 'tour',
          where: Object.keys(tourWhere).length > 0 ? tourWhere : undefined,
          attributes: [
            'id',
            'tour_code',
            'title',
            'start_date',
            'end_date',
            'region',
          ],
          required: true, // INNER JOIN để chỉ lấy tour có trong tour_guides
        },
      ],
      order: [['start_date', 'ASC']], // Mặc định, sẽ được override bởi sort logic
      distinct: true, // Quan trọng: tránh đếm trùng khi có join
    });

    // Tính quantity_client cho mỗi tour assignment và format kết quả
    const toursWithQuantity = await Promise.all(
      rows.map(async (assignment) => {
        const assignmentData = assignment.toJSON() as any;
        const tour = assignmentData.tour;
        
        // Tính số khách hàng (số vé) từ orders được phân cho guide này
        const orders = await Order.findAll({
          where: {
            tour_id: tour?.id,
            guide_id: assignmentData.guide_id,
            start_date: assignmentData.start_date,
            end_date: assignmentData.end_date,
            status: { [Op.in]: ['confirmed', 'completed'] },
          },
          attributes: ['quantity'],
        });
        
        const quantity_client = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        
        return {
          id: tour?.id || null,
          tour_code: tour?.tour_code || null,
          title: tour?.title || null,
          start_date: tour?.start_date || null,
          end_date: tour?.end_date || null,
          region: tour?.region || null,
          quantity_client: quantity_client,
          guide_id: assignmentData.guide_id,
          tour_guide_start_date: assignmentData.start_date,
          tour_guide_end_date: assignmentData.end_date,
        };
      })
    );

    // Group by tour_id, start_date, end_date và chỉ lấy 1 tour đại diện
    // Tổng hợp quantity_client của tất cả guides cho cùng 1 tour
    const tourMap = new Map<string, any>();
    
    for (const item of toursWithQuantity) {
      const key = `${item.id}_${item.tour_guide_start_date}_${item.tour_guide_end_date}`;
      
      if (!tourMap.has(key)) {
        // Lưu tour đầu tiên làm đại diện
        tourMap.set(key, { ...item });
      } else {
        const existing = tourMap.get(key);
        // Tổng hợp quantity_client của tất cả guides
        existing.quantity_client += item.quantity_client;
        // Lấy guide_id của guide có quantity_client lớn nhất (hoặc giữ guide_id đầu tiên)
        // Có thể không cần guide_id nữa vì đã group lại
      }
    }

    // Chuyển Map thành Array và loại bỏ guide_id vì đã group lại (hoặc giữ guide_id đầu tiên)
    const uniqueTours = Array.from(tourMap.values()).map(tour => {
      // Giữ lại guide_id của guide đầu tiên (hoặc có thể set null)
      return {
        ...tour,
        guide_id: tour.guide_id, // Giữ guide_id của record đầu tiên
      };
    });

    // Sort theo các trường được yêu cầu
    if (startDateSort === 'asc' || startDateSort === 'desc') {
      uniqueTours.sort((a, b) => {
        const dateA = new Date(a.start_date || 0).getTime();
        const dateB = new Date(b.start_date || 0).getTime();
        return startDateSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (endDateSort === 'asc' || endDateSort === 'desc') {
      uniqueTours.sort((a, b) => {
        const dateA = new Date(a.end_date || 0).getTime();
        const dateB = new Date(b.end_date || 0).getTime();
        return endDateSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (quantityClientSort === 'asc' || quantityClientSort === 'desc') {
      uniqueTours.sort((a, b) => {
        return quantityClientSort === 'asc' 
          ? a.quantity_client - b.quantity_client 
          : b.quantity_client - a.quantity_client;
      });
    }

    // Apply pagination sau khi sort
    const paginatedTours = uniqueTours.slice(offset, offset + limit);

    return {
      tours: paginatedTours,
      pagination: {
        page,
        limit,
        total: uniqueTours.length, // Total sau khi filter, deduplicate và sort
        totalPages: Math.ceil(uniqueTours.length / limit),
      },
    };
  }

  /**
   * Lấy danh sách guides theo tour_id, start_date, và end_date
   * Tìm guides có khoảng thời gian overlap với khoảng thời gian được truyền vào
   * Nếu có nhiều records trùng guide_id, start_date, end_date thì chỉ trả về 1 tour đại diện
   */
  async getGuidesByTourAndDates(
    tourId: number,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    // Tìm guides có khoảng thời gian overlap với khoảng thời gian được truyền vào
    // Điều kiện overlap: tourGuide.start_date <= endDate AND tourGuide.end_date >= startDate
    const tourGuides = await TourGuide.findAll({
      where: {
        tour_id: tourId,
        [Op.and]: [
          { start_date: { [Op.lte]: endDate } },
          { end_date: { [Op.gte]: startDate } },
        ],
      },
      include: [
        {
          model: Admin,
          as: 'guide',
          attributes: ['id', 'username', 'email', 'phone', 'region', 'is_active'],
          required: true, // INNER JOIN - chỉ lấy guides có thông tin
        },
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'tour_code', 'title', 'start_date', 'end_date', 'destination'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']], // Sắp xếp theo created_at DESC để lấy record mới nhất
    });

    // Map dữ liệu
    const mappedData = tourGuides.map((tg) => {
      const tgData = tg.toJSON() as any;
      return {
        id: tgData.id,
        tour_id: tgData.tour_id,
        guide_id: tgData.guide_id,
        start_date: tgData.start_date,
        end_date: tgData.end_date,
        guide: tgData.guide ? {
          id: tgData.guide.id,
          username: tgData.guide.username,
          email: tgData.guide.email,
          phone: tgData.guide.phone,
          region: tgData.guide.region,
          is_active: tgData.guide.is_active,
        } : null,
        tour: tgData.tour ? {
          id: tgData.tour.id,
          tour_code: tgData.tour.tour_code,
          title: tgData.tour.title,
          start_date: tgData.tour.start_date,
          end_date: tgData.tour.end_date,
          destination: tgData.tour.destination,
        } : null,
        created_at: tgData.created_at,
        updated_at: tgData.updated_at,
      };
    });

    // Group by guide_id, start_date, end_date và chỉ lấy 1 record đại diện (record mới nhất)
    const guideMap = new Map<string, any>();
    
    for (const item of mappedData) {
      const key = `${item.guide_id}_${item.start_date}_${item.end_date}`;
      
      // Nếu chưa có trong map hoặc record hiện tại mới hơn (created_at lớn hơn)
      if (!guideMap.has(key)) {
        guideMap.set(key, item);
      } else {
        const existing = guideMap.get(key);
        // So sánh created_at, lấy record mới hơn
        const existingDate = new Date(existing.created_at);
        const currentDate = new Date(item.created_at);
        if (currentDate > existingDate) {
          guideMap.set(key, item);
        }
      }
    }

    // Trả về danh sách đã được deduplicate
    return Array.from(guideMap.values());
  }

  /**
   * Lấy tất cả tours của guide dựa vào guide_id với pagination và status filter
   * @param guideId - ID của guide
   * @param page - Số trang (mặc định: 1)
   * @param limit - Số lượng tours mỗi trang (mặc định: 10)
   * @param status - Trạng thái filter: 'valid'/'active' (còn hạn) hoặc 'expired'/'invalid' (hết hạn)
   */
  async getToursByGuideId(
    guideId: number,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ tours: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const offset = (page - 1) * limit;

    // Helper: format Date to YYYY-MM-DD using LOCAL time
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Lấy ngày hôm nay (local time, chỉ so sánh ngày)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = formatLocalDate(today);

    // Build where clause cho Tour include dựa trên status
    const tourWhere: any = {};
    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower === 'valid' || statusLower === 'active') {
        // Còn hạn: end_date >= today (inclusive)
        tourWhere.end_date = {
          [Op.gte]: todayString,
        };
      } else if (statusLower === 'expired' || statusLower === 'invalid') {
        // Hết hạn: end_date < today (exclusive)
        tourWhere.end_date = {
          [Op.lt]: todayString,
        };
      }
    }

    // Query với pagination
    const { rows: tourGuides, count: total } = await TourGuide.findAndCountAll({
      where: {
        guide_id: guideId,
      },
      include: [
        {
          model: Tour,
          as: 'tour',
          where: Object.keys(tourWhere).length > 0 ? tourWhere : undefined,
          required: true, // INNER JOIN - chỉ lấy tours có trong bảng Tour
          attributes: [
            'id',
            'tour_code',
            'title',
            'description',
            'region',
            'destination',
            'departure',
            'start_date',
            'end_date',
            'duration',
            'price',
            'capacity',
            'rating',
            'total_reviews',
            'latitude',
            'longitude',
            'main_image',
            'is_active',
            'created_at',
            'updated_at',
          ],
        },
      ],
      order: [['start_date', 'DESC']],
      limit,
      offset,
      distinct: true, // Quan trọng: tránh đếm trùng khi có join
    });

    // Map kết quả
    const tours = tourGuides.map((tg) => {
      const tgData = tg.toJSON() as any;
      return {
        id: tgData.id,
        tour_id: tgData.tour_id,
        guide_id: tgData.guide_id,
        assignment_start_date: tgData.start_date,
        assignment_end_date: tgData.end_date,
        tour: tgData.tour,
        created_at: tgData.created_at,
        updated_at: tgData.updated_at,
      };
    });

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      tours,
      pagination: {
        page: total > 0 ? page : 1,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Lấy danh sách đơn hàng được phân công cho guide theo tour_id, start_date, end_date
   */
  async getOrdersByGuideAndTour(
    guideId: number,
    tourId: number,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const orders = await Order.findAll({
      where: {
        guide_id: guideId,
        tour_id: tourId,
        start_date: startDate,
        end_date: endDate,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'phone'],
          required: true,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return orders.map((order) => {
      const orderData = order.toJSON() as any;
      return {
        order_code: orderData.order_code,
        customer_name: orderData.user?.username || '',
        phone: orderData.user?.phone || '',
        ticket_count: orderData.quantity,
      };
    });
  }

  /**
   * Lấy danh sách tours của guide với thống kê orders và tickets (cho admin page)
   * @param guideId - ID của guide (optional, nếu không có thì lấy tất cả)
   * @param page - Số trang
   * @param limit - Số lượng mỗi trang
   * @param search - Tìm kiếm theo tên tour hoặc mã tour
   * @param valid - 'valid' để lấy tour còn hạn (end_date >= today), 'invalid' để lấy tour hết hạn (end_date < today)
   */
  async getGuideToursForAdmin(
    guideId?: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    valid?: 'valid' | 'invalid'
  ): Promise<any> {
    const offset = (page - 1) * limit;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {};
    if (guideId) {
      where.guide_id = guideId;
    }

    // Filter by valid/invalid based on end_date
    if (valid === 'valid') {
      where.end_date = { [Op.gte]: today };
    } else if (valid === 'invalid') {
      where.end_date = { [Op.lt]: today };
    }

    const tourGuides = await TourGuide.findAndCountAll({
      where,
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: [
            'id',
            'tour_code',
            'title',
            'start_date',
            'end_date',
          ],
          required: true,
          where: search
            ? {
                [Op.or]: [
                  { title: { [Op.like]: `%${search}%` } },
                  { tour_code: { [Op.like]: `%${search}%` } },
                ],
              }
            : undefined,
        },
      ],
      order: [['start_date', 'DESC']],
      limit,
      offset,
    });

    // Lấy thống kê orders và tickets cho mỗi tour assignment
    const toursWithStats = await Promise.all(
      tourGuides.rows.map(async (tg) => {
        const tgData = tg.toJSON() as any;
        const tour = tgData.tour;

        // Đếm số orders và tổng số tickets cho tour assignment này
        const orders = await Order.findAll({
          where: {
            tour_id: tour.id,
            guide_id: tgData.guide_id,
            start_date: tgData.start_date,
            end_date: tgData.end_date,
            status: { [Op.in]: ['confirmed', 'completed'] },
          },
          attributes: ['id', 'quantity'],
        });

        const order_quantity = orders.length;
        const ticket_quantity = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);

        return {
          id: tgData.id,
          key: tgData.id,
          tour_code: tour.tour_code,
          title: tour.title,
          order_quantity,
          start_date: tgData.start_date,
          end_date: tgData.end_date,
          guide_id: tgData.guide_id,
        };
      })
    );

    return {
      tours: toursWithStats,
      pagination: {
        page,
        limit,
        total: tourGuides.count,
        totalPages: Math.ceil(tourGuides.count / limit),
      },
    };
  }

  /**
   * Lấy danh sách đơn hàng theo tour assignment (cho admin page)
   * @param tourId - ID của tour
   * @param guideId - ID của guide
   * @param startDate - Ngày bắt đầu của assignment
   * @param endDate - Ngày kết thúc của assignment
   */
  async getOrdersByTourAssignment(
    tourId: number,
    guideId: number,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const orders = await Order.findAll({
      where: {
        tour_id: tourId,
        guide_id: guideId,
        start_date: startDate,
        end_date: endDate,
        status: { [Op.in]: ['confirmed', 'completed'] },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'phone'],
          required: true,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return orders.map((order) => {
      const orderData = order.toJSON() as any;
      return {
        id: orderData.id,
        order_code: orderData.order_code,
        customer_name: orderData.user?.username || '',
        phone: orderData.user?.phone || '',
        ticket_quantity: orderData.quantity,
      };
    });
  }
}

export default new TourGuideAssignmentService();

