import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Admin from '../models/Admin';

interface UserSocket extends Socket {
  userId?: number;
  userType?: 'user' | 'admin';
}

class SocketService {
  private io: Server | null = null;
  private connectedUsers: Map<number, string> = new Map(); // userId -> socketId
  private connectedAdmins: Map<number, string> = new Map(); // adminId -> socketId

  initialize(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('✅ Socket.IO đã được khởi tạo');
    return this.io;
  }

  private async authenticateSocket(socket: UserSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Không tìm thấy token xác thực'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

      // Kiểm tra loại người dùng (user hoặc admin)
      if (decoded.id) {
        // Đây là user token
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return next(new Error('Người dùng không tồn tại'));
        }
        socket.userId = decoded.id;
        socket.userType = 'user';
      } else if (decoded.adminId) {
        // Đây là admin token
        const admin = await Admin.findByPk(decoded.adminId);
        if (!admin) {
          return next(new Error('Quản trị viên không tồn tại'));
        }
        socket.userId = decoded.adminId;
        socket.userType = 'admin';
      } else {
        return next(new Error('Token không hợp lệ'));
      }

      next();
    } catch (error) {
      console.error('❌ Lỗi xác thực socket:', error);
      next(new Error('Xác thực không thành công'));
    }
  }

  private handleConnection(socket: UserSocket) {
    console.log(`🔌 Client đã kết nối: ${socket.id}, Type: ${socket.userType}, ID: ${socket.userId}`);

    if (!socket.userId || !socket.userType) {
      socket.disconnect();
      return;
    }

    // Lưu thông tin kết nối
    if (socket.userType === 'user') {
      this.connectedUsers.set(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
    } else if (socket.userType === 'admin') {
      this.connectedAdmins.set(socket.userId, socket.id);
      socket.join(`admin:${socket.userId}`);
      // Admin join vào room để nhận tất cả thông báo admin
      socket.join('admins');
    }
      // Xử lý sự kiện register từ FE
    socket.on('register', (data: { role: 'user' | 'admin'; userId: number }) => {
      if (data.role === 'user') socket.join(`user:${data.userId}`);
      else if (data.role === 'admin') socket.join(`admin:${data.userId}`);
    });
    
    // Xử lý sự kiện disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client đã ngắt kết nối: ${socket.id}`);
      if (socket.userType === 'user') {
        this.connectedUsers.delete(socket.userId!);
      } else if (socket.userType === 'admin') {
        this.connectedAdmins.delete(socket.userId!);
      }
    });

    // Xử lý sự kiện đánh dấu đã đọc thông báo
    socket.on('notification:read', (data: { notificationId: number }) => {
      console.log(`📖 Notification ${data.notificationId} đã được đọc bởi ${socket.userType}:${socket.userId}`);
      // Emit lại cho chính user đó (nếu có nhiều tab/device)
      if (socket.userType === 'user') {
        this.io?.to(`user:${socket.userId}`).emit('notification:read', data);
      } else if (socket.userType === 'admin') {
        this.io?.to(`admin:${socket.userId}`).emit('notification:read', data);
      }
    });

    // Test ping-pong
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  // Gửi thông báo cho một user cụ thể
  sendNotificationToUser(userId: number, notification: any) {
    if (!this.io) {
      console.error('❌ Socket.IO chưa được khởi tạo');
      return false;
    }

    console.log(`📤 Gửi thông báo đến user:${userId}`, notification);
    this.io.to(`user:${userId}`).emit('notification:new', notification);
    return true;
  }

  // Gửi thông báo cho tất cả user
  sendNotificationToAllUsers(notification: any) {
    if (!this.io) {
      console.error('❌ Socket.IO chưa được khởi tạo');
      return false;
    }

    console.log('📤 Gửi thông báo đến tất cả user');
    // Gửi đến từng user đang online
    this.connectedUsers.forEach((socketId, userId) => {
      this.io?.to(`user:${userId}`).emit('notification:new', notification);
    });
    return true;
  }


  // Lấy instance của io
  getIO(): Server | null {
    return this.io;
  }
}
export default new SocketService();

