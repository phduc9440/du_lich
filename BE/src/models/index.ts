import User from './User';
import Admin from './Admin';
import Category from './Category';
import Tour from './Tour';
import TourCategory from './TourCategory';
import TourInclude from './TourInclude';
import TourExclude from './TourExclude';
import TourSchedule from './TourSchedule';
import TourGallery from './TourGallery';
import TourGuide from './TourGuide';
import Order from './Order';
import Ticket from './Ticket';
import Coupon from './Coupon';
import UsedCoupon from './UsedCoupon';
import Review from './Review';
import ReviewImage from './ReviewImage';
import Feedback from './Feedback';
import Notification from './Notification';
import NotificationRead from './NotificationRead';

// ========================
// RELATIONSHIPS
// ========================

// Tour - Category (Many-to-Many through TourCategory)
Tour.belongsToMany(Category, {
  through: TourCategory,
  foreignKey: 'tour_id',
  otherKey: 'category_id',
  as: 'categories',
  onDelete: 'CASCADE',
});

Category.belongsToMany(Tour, {
  through: TourCategory,
  foreignKey: 'category_id',
  otherKey: 'tour_id',
  as: 'tours',
  onDelete: 'CASCADE',
});

// Tour - TourInclude (1-n)
Tour.hasMany(TourInclude, {
  foreignKey: 'tour_id',
  as: 'includes',
  onDelete: 'CASCADE',
});

TourInclude.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'CASCADE',
});

// Tour - TourExclude (1-n)
Tour.hasMany(TourExclude, {
  foreignKey: 'tour_id',
  as: 'excludes',
  onDelete: 'CASCADE',
});

TourExclude.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'CASCADE',
});

// Tour - TourSchedule (1-n)
Tour.hasMany(TourSchedule, {
  foreignKey: 'tour_id',
  as: 'schedule',
  onDelete: 'CASCADE',
});

TourSchedule.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'CASCADE',
});

// Tour - TourGallery (1-n)
Tour.hasMany(TourGallery, {
  foreignKey: 'tour_id',
  as: 'gallery',
  onDelete: 'CASCADE',
});

TourGallery.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'CASCADE',
});

// User - Order (1-n)
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
  onDelete: 'SET NULL',
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'SET NULL',
});

// Tour - Order (1-n)
Tour.hasMany(Order, {
  foreignKey: 'tour_id',
  as: 'orders',
  onDelete: 'SET NULL',
});

Order.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'SET NULL',
});

// Admin - Order (1-n) through guide_id
Admin.hasMany(Order, {
  foreignKey: 'guide_id',
  as: 'guidedOrders',
  onDelete: 'SET NULL',
});

Order.belongsTo(Admin, {
  foreignKey: 'guide_id',
  as: 'guide',
  onDelete: 'SET NULL',
});

// Tour - TourGuide (Many-to-Many through TourGuide)
Tour.belongsToMany(Admin, {
  through: TourGuide,
  foreignKey: 'tour_id',
  otherKey: 'guide_id',
  as: 'guides',
  onDelete: 'CASCADE',
});

Admin.belongsToMany(Tour, {
  through: TourGuide,
  foreignKey: 'guide_id',
  otherKey: 'tour_id',
  as: 'tours',
  onDelete: 'CASCADE',
});

TourGuide.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'CASCADE',
});

TourGuide.belongsTo(Admin, {
  foreignKey: 'guide_id',
  as: 'guide',
  onDelete: 'CASCADE',
});

// Order - Ticket (1-n)
Order.hasMany(Ticket, {
  foreignKey: 'order_id',
  as: 'tickets',
  onDelete: 'CASCADE',
});

Ticket.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
  onDelete: 'CASCADE',
});

// Coupon - UsedCoupon (1-n)
Coupon.hasMany(UsedCoupon, {
  foreignKey: 'coupon_id',
  as: 'usedCoupons',
  onDelete: 'CASCADE',
});

UsedCoupon.belongsTo(Coupon, {
  foreignKey: 'coupon_id',
  as: 'coupon',
  onDelete: 'CASCADE',
});

// Order - UsedCoupon (1-n)
Order.hasMany(UsedCoupon, {
  foreignKey: 'order_id',
  as: 'usedCoupons',
  onDelete: 'SET NULL',
});

UsedCoupon.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
  onDelete: 'SET NULL',
});

// User - Ticket (1-n)
User.hasMany(Ticket, {
  foreignKey: 'user_id',
  as: 'tickets',
  onDelete: 'CASCADE',
});

Ticket.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});

// User - Review (1-n)
User.hasMany(Review, {
  foreignKey: 'user_id',
  as: 'reviews',
  onDelete: 'SET NULL',
});

Review.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'SET NULL',
});

// Tour - Review (1-n)
Tour.hasMany(Review, {
  foreignKey: 'tour_id',
  as: 'reviews',
  onDelete: 'CASCADE',
});

Review.belongsTo(Tour, {
  foreignKey: 'tour_id',
  as: 'tour',
  onDelete: 'CASCADE',
});

// Review - ReviewImage (1-n)
Review.hasMany(ReviewImage, {
  foreignKey: 'review_id',
  as: 'images',
  onDelete: 'CASCADE',
});

ReviewImage.belongsTo(Review, {
  foreignKey: 'review_id',
  as: 'review',
  onDelete: 'CASCADE',
});

// User - Feedback (1-n)
User.hasMany(Feedback, {
  foreignKey: 'user_id',
  as: 'feedbacks',
  onDelete: 'SET NULL',
});

Feedback.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'SET NULL',
});

// User - Notification (1-n)
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
  onDelete: 'CASCADE',
});

Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});

// ----------------------
// Quan hệ nhiều-nhiều: theo dõi trạng thái đọc
// ----------------------
User.belongsToMany(Notification, {
  through: NotificationRead,
  foreignKey: 'user_id',
  otherKey: 'notification_id',
  as: 'readNotifications',
  onDelete: 'CASCADE',
});

Notification.belongsToMany(User, {
  through: NotificationRead,
  foreignKey: 'notification_id',
  otherKey: 'user_id',
  as: 'readByUsers',
  onDelete: 'CASCADE',
});

// Optional: truy vấn trực tiếp NotificationRead
Notification.hasMany(NotificationRead, { foreignKey: 'notification_id', as: 'reads', onDelete: 'CASCADE' });
NotificationRead.belongsTo(Notification, { foreignKey: 'notification_id', as: 'notification', onDelete: 'CASCADE' });

User.hasMany(NotificationRead, { foreignKey: 'user_id', as: 'notificationReads', onDelete: 'CASCADE' });
NotificationRead.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });

export {
  User,
  Admin,
  Category,
  Tour,
  TourCategory,
  TourInclude,
  TourExclude,
  TourSchedule,
  TourGallery,
  TourGuide,
  Order,
  Ticket,
  Coupon,
  UsedCoupon,
  Review,
  ReviewImage,
  Feedback,
  Notification,
  NotificationRead,
};
