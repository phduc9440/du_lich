'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // ========== 1. ADMINS ==========
    console.log('🔄 Seeding Admins...');
    const hashedAdminPassword = await bcrypt.hash('Admin@123456', 10);

    // Tạo admins với role enum (sử dụng ON DUPLICATE KEY để cập nhật nếu đã tồn tại)
    await queryInterface.sequelize.query(
      `INSERT INTO admins (username, email, password_hash, role, is_active, created_at, updated_at) 
       VALUES 
       ('superadmin', 'admin@tourmanager.com', ?, 'super_admin', true, NOW(), NOW()),
       ('contentmanager', 'content@tourmanager.com', ?, 'employee', true, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         updated_at = VALUES(updated_at)`,
      { replacements: [hashedAdminPassword, hashedAdminPassword] }
    );

    // Lấy admin IDs
    const [superAdmin] = await queryInterface.sequelize.query(
      "SELECT id FROM admins WHERE username = 'superadmin' LIMIT 1"
    );
    const [contentManager] = await queryInterface.sequelize.query(
      "SELECT id FROM admins WHERE username = 'contentmanager' LIMIT 1"
    );

    console.log('✅ Đã tạo 2 admins và gán role enum');

    // Thêm một số guides với region
    await queryInterface.sequelize.query(
      `INSERT INTO admins (username, email, password_hash, role, region, is_active, created_at, updated_at)
       VALUES
       ('guide_north', 'guide_north@tourmanager.com', ?, 'guide', 'northern', true, NOW(), NOW()),
       ('guide_central', 'guide_central@tourmanager.com', ?, 'guide', 'central', true, NOW(), NOW()),
       ('guide_south', 'guide_south@tourmanager.com', ?, 'guide', 'southern', true, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         region = VALUES(region),
         updated_at = VALUES(updated_at)`,
      { replacements: [hashedAdminPassword, hashedAdminPassword, hashedAdminPassword] }
    );

    console.log('✅ Đã tạo thêm 3 guides với region');

    // ========== 2. CATEGORIES ==========
    console.log('🔄 Seeding Categories...');
    const [existingCategories] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM categories"
    );
    
    if (existingCategories[0].count === 0) {
      await queryInterface.bulkInsert('categories', [
        { category: 'biển', description: 'Tour du lịch biển, đảo với bãi cát trắng và nước trong xanh', created_at: now, updated_at: now },
        { category: 'núi', description: 'Tour leo núi, trekking, khám phá thiên nhiên hoang dã', created_at: now, updated_at: now },
        { category: 'thành phố', description: 'Tour khám phá thành phố, văn hóa, ẩm thực đặc sắc', created_at: now, updated_at: now },
        { category: 'trekking', description: 'Tour đi bộ đường dài, khám phá thiên nhiên', created_at: now, updated_at: now },
        { category: 'văn hóa', description: 'Tour văn hóa - lịch sử, khám phá di sản', created_at: now, updated_at: now },
      ], {});
      console.log('✅ Đã tạo 5 categories');
    } else {
      console.log('⏭️  Categories đã tồn tại, bỏ qua');
    }

    // ========== 4. USERS ==========
    console.log('🔄 Seeding Users...');
    const hashedUserPassword = await bcrypt.hash('User@123456', 10);
    
    // Insert users với ON DUPLICATE KEY
    const usersData = [
      ['nguyenvana', 'nguyenvana@example.com', '0901234567', 'male', 'https://i.pravatar.cc/150?img=1'],
      ['tranthib', 'tranthib@example.com', '0902345678', 'female', 'https://i.pravatar.cc/150?img=5'],
      ['levanc', 'levanc@example.com', '0903456789', 'male', 'https://i.pravatar.cc/150?img=3'],
      ['phamthid', 'phamthid@example.com', '0904567890', 'female', 'https://i.pravatar.cc/150?img=10'],
      ['hoangvane', 'hoangvane@example.com', '0905678901', 'male', 'https://i.pravatar.cc/150?img=8'],
      ['vuthif', 'vuthif@example.com', '0906789012', 'female', 'https://i.pravatar.cc/150?img=9'],
      ['dangvang', 'dangvang@example.com', '0907890123', 'male', 'https://i.pravatar.cc/150?img=12'],
      ['buithih', 'buithih@example.com', '0908901234', 'female', 'https://i.pravatar.cc/150?img=20'],
      ['ngothii', 'ngothii@example.com', '0909012345', 'female', 'https://i.pravatar.cc/150?img=23'],
      ['dovank', 'dovank@example.com', '0910123456', 'male', 'https://i.pravatar.cc/150?img=15']
    ];

    for (const [username, email, phone, gender, avatar] of usersData) {
      await queryInterface.sequelize.query(
        `INSERT INTO users (username, email, password_hash, phone, gender, avatar_url, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           phone = VALUES(phone),
           gender = VALUES(gender),
           avatar_url = VALUES(avatar_url),
           updated_at = VALUES(updated_at)`,
        { replacements: [username, email, hashedUserPassword, phone, gender, avatar] }
      );
    }
    console.log('✅ Đã tạo 10 users');

    // ========== 5. TOURS ==========
    console.log('🔄 Seeding Tours...');
    
    // Lấy category IDs
    const [beachCat] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE category = 'biển' LIMIT 1");
    const [mountainCat] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE category = 'núi' LIMIT 1");
    const [cityCat] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE category = 'thành phố' LIMIT 1");
    const [hikingCat] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE category = 'trekking' LIMIT 1");
    const [culturalCat] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE category = 'văn hóa' LIMIT 1");

    const toursSeedData = [
      {
        tour_code: 'TOUR001',
        title: 'Tour Đà Lạt 3N2Đ - Thành phố ngàn hoa',
        description: 'Khám phá thành phố Đà Lạt xinh đẹp với khí hậu mát mẻ quanh năm. Tham quan thác Datanla, hồ Xuân Hương, Thiền viện Trúc Lâm, Crazy House. Thưởng thức đặc sản địa phương như lẩu gà lá é, bánh tráng nướng. Check-in tại các điểm sống ảo hot nhất Đà Lạt.',
        region: 'central',
        category_id: cityCat[0]?.id || 3,
        destination: 'Đà Lạt, Lâm Đồng',
        departure: 'Hà Nội',
        start_date: '2026-05-20',
        end_date: '2026-05-22',
        duration: '3n2d',
        price: 2500000.00,
        capacity: 30,
        rating: 4.8,
        total_reviews: 125,
        latitude: 11.940419,
        longitude: 108.458313,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR002',
        title: 'Tour Nha Trang 4N3Đ - Thiên đường biển đảo',
        description: 'Tận hưởng bãi biển đẹp nhất Việt Nam với cát trắng mịn và nước biển trong xanh. Tham quan Vinpearl Land, đảo Hòn Mun, Hòn Tằm, Hòn Miễu. Lặn ngắm san hô, thưởng thức hải sản tươi ngon. Vui chơi tại công viên nước hiện đại.',
        region: 'southern',
        category_id: beachCat[0]?.id || 1,
        destination: 'Nha Trang, Khánh Hòa',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-06-05',
        end_date: '2026-06-08',
        duration: '4n3d',
        price: 3500000.00,
        capacity: 40,
        rating: 4.9,
        total_reviews: 200,
        latitude: 12.238791,
        longitude: 109.196749,
        main_image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR003',
        title: 'Tour Hạ Long 2N1Đ - Di sản thế giới UNESCO',
        description: 'Du thuyền sang trọng trên vịnh Hạ Long với hơn 1600 hòn đảo lớn nhỏ. Tham quan hang Sửng Sốt, hang Thiên Cung, đảo Titop, làng chài Cửa Vạn. Thưởng thức buffet hải sản tươi sống. Ngắm hoàng hôn và bình minh tuyệt đẹp trên vịnh.',
        region: 'northern',
        category_id: beachCat[0]?.id || 1,
        destination: 'Hạ Long, Quảng Ninh',
        departure: 'Hà Nội',
        start_date: '2026-06-15',
        end_date: '2026-06-16',
        duration: '2n1d',
        price: 1800000.00,
        capacity: 25,
        rating: 4.7,
        total_reviews: 180,
        latitude: 20.910051,
        longitude: 107.183902,
        main_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR004',
        title: 'Tour Sapa 3N2Đ - Nóc nhà Đông Dương',
        description: 'Chinh phục đỉnh Fansipan - nóc nhà Đông Dương với cáp treo hiện đại. Tham quan bản Cát Cát, thác Tình Yêu, nhà thờ đá. Trải nghiệm văn hóa dân tộc vùng cao. Thưởng thức thắng cố đặc sắc.',
        region: 'northern',
        category_id: mountainCat[0]?.id || 2,
        destination: 'Sapa, Lào Cai',
        departure: 'Hà Nội',
        start_date: '2026-06-20',
        end_date: '2026-06-22',
        duration: '3n2d',
        price: 2800000.00,
        capacity: 20,
        rating: 4.6,
        total_reviews: 95,
        latitude: 22.336360,
        longitude: 103.843785,
        main_image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR005',
        title: 'Tour Phú Quốc 4N3Đ - Đảo ngọc',
        description: 'Khám phá hòn đảo lớn nhất Việt Nam với bãi biển đẹp nhất hành tinh. Tham quan Vinpearl Safari, Công viên chủ đề, làng chài Hàm Ninh. Lặn biển ngắm san hô, thưởng thức hải sản. Vui chơi resort 5 sao.',
        region: 'southern',
        category_id: beachCat[0]?.id || 1,
        destination: 'Phú Quốc, Kiên Giang',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-07-01',
        end_date: '2026-07-04',
        duration: '4n3d',
        price: 4200000.00,
        capacity: 35,
        rating: 4.9,
        total_reviews: 250,
        latitude: 10.289879,
        longitude: 103.984024,
        main_image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR006',
        title: 'Tour Hội An 3N2Đ - Phố cổ di sản',
        description: 'Khám phá phố cổ Hội An - di sản văn hóa thế giới UNESCO. Tham quan Chùa Cầu, Nhà Cổ Phùng Hưng, Hội Quán Phúc Kiến. Trải nghiệm làm đèn lồng, học nấu ăn. Vui chơi bãi biển An Bàng.',
        region: 'central',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Hội An, Quảng Nam',
        departure: 'Đà Nẵng',
        start_date: '2026-07-10',
        end_date: '2026-07-12',
        duration: '3n2d',
        price: 2200000.00,
        capacity: 30,
        rating: 4.8,
        total_reviews: 160,
        latitude: 15.880058,
        longitude: 108.338046,
        main_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR007',
        title: 'Tour Huế 2N1Đ - Kinh đô cố đô',
        description: 'Khám phá cố đô Huế với các di tích lịch sử. Tham quan Đại Nội, Lăng Tự Đức, Chùa Thiên Mụ. Du thuyền trên sông Hương, thưởng thức ẩm thực cung đình. Trải nghiệm văn hóa cung đình Việt Nam.',
        region: 'central',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Huế, Thừa Thiên Huế',
        departure: 'Đà Nẵng',
        start_date: '2026-07-18',
        end_date: '2026-07-19',
        duration: '2n1d',
        price: 1500000.00,
        capacity: 25,
        rating: 4.5,
        total_reviews: 120,
        latitude: 16.463713,
        longitude: 107.590866,
        main_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR008',
        title: 'Tour Đà Nẵng 3N2Đ - Thành phố đáng sống',
        description: 'Khám phá thành phố Đà Nẵng hiện đại và phát triển. Tham quan Bà Nà Hills, Cầu Vàng, Ngũ Hành Sơn, Chùa Linh Ứng. Thưởng thức hải sản tươi ngon, mua sắm tại chợ Hàn.',
        region: 'central',
        category_id: cityCat[0]?.id || 3,
        destination: 'Đà Nẵng',
        departure: 'Hà Nội',
        start_date: '2026-07-25',
        end_date: '2026-07-27',
        duration: '3n2d',
        price: 2600000.00,
        capacity: 35,
        rating: 4.7,
        total_reviews: 140,
        latitude: 16.054407,
        longitude: 108.202167,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR009',
        title: 'Tour Miền Tây 2N1Đ - Vùng đất Sen Hồng',
        description: 'Khám phá vùng đất Miền Tây với vườn cây ăn trái. Tham quan Cồn Thới, vườn nhãn, nhà vườn. Thưởng thức trái cây tươi ngon, thưởng thức đờn ca tài tử. Trải nghiệm sông nước miền Tây.',
        region: 'southern',
        category_id: cityCat[0]?.id || 3,
        destination: 'Miền Tây, Đồng Tháp',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-08-01',
        end_date: '2026-08-02',
        duration: '2n1d',
        price: 1200000.00,
        capacity: 40,
        rating: 4.4,
        total_reviews: 85,
        latitude: 10.746089,
        longitude: 105.768040,
        main_image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR010',
        title: 'Tour Tây Nguyên 4N3Đ - Cao nguyên xanh',
        description: 'Khám phá vùng Tây Nguyên với cao nguyên xanh mát. Tham quan Buôn Ma Thuột, Pleiku, Kon Tum. Trải nghiệm văn hóa dân tộc Ê Đê, Gia Rai. Thưởng thức cà phê đặc sản.',
        region: 'central',
        category_id: cityCat[0]?.id || 3,
        destination: 'Buôn Ma Thuột, Đắk Lắk',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-08-08',
        end_date: '2026-08-11',
        duration: '4n3d',
        price: 3200000.00,
        capacity: 25,
        rating: 4.6,
        total_reviews: 110,
        latitude: 12.666194,
        longitude: 108.038247,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR011',
        title: 'Tour Cần Thơ 1N0Đ - Tây Đô',
        description: 'Khám phá Cần Thơ - Tây Đô với chợ nổi, vườn cây ăn trái. Tham quan Lò Heo, Chợ Bến Ninh, Cồn Sơn. Thưởng thức trái cây, thưởng thức đờn ca tài tử.',
        region: 'southern',
        category_id: cityCat[0]?.id || 3,
        destination: 'Cần Thơ',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-08-15',
        end_date: '2026-08-15',
        duration: '1n0d',
        price: 800000.00,
        capacity: 50,
        rating: 4.3,
        total_reviews: 75,
        latitude: 10.045162,
        longitude: 105.746857,
        main_image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR012',
        title: 'Tour Sa Pa Trekking 4N3Đ',
        description: 'Chinh phục các đỉnh núi cao với trekking chuyên nghiệp. Tham quan Thác Bạc, Cổng Trời, bản Lao Chải. Trải nghiệm homestay với đồng bào dân tộc. Thưởng thức thắng cố vùng cao.',
        region: 'northern',
        category_id: hikingCat[0]?.id || 4,
        destination: 'Sa Pa, Lào Cai',
        departure: 'Hà Nội',
        start_date: '2026-08-20',
        end_date: '2026-08-23',
        duration: '4n3d',
        price: 3500000.00,
        capacity: 15,
        rating: 4.8,
        total_reviews: 65,
        latitude: 22.336360,
        longitude: 103.843785,
        main_image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR013',
        title: 'Tour Côn Đảo 3N2Đ - Địa ngục trần gian',
        description: 'Khám phá quần đảo Côn Đảo với nhà tù lịch sử. Tham quan Nghĩa Trang Hàng Dương, Nhà Tù Côn Đảo, Bãi Đầm Trầu. Lặn biển ngắm san hô, thưởng thức hải sản.',
        region: 'southern',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Côn Đảo, Bà Rịa Vũng Tàu',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-09-01',
        end_date: '2026-09-03',
        duration: '3n2d',
        price: 4800000.00,
        capacity: 20,
        rating: 4.7,
        total_reviews: 95,
        latitude: 8.688910,
        longitude: 106.607650,
        main_image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR014',
        title: 'Tour Hoi An Full Moon 3N2Đ',
        description: 'Trải nghiệm Festival đèn lồng Hoi An đầy màu sắc. Tham quan phố cổ về đêm, chợ đêm, cầu Nhật. Tham gia lễ hội, thưởng thức ẩm thực đường phố. Vui chơi bãi biển.',
        region: 'central',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Hội An, Quảng Nam',
        departure: 'Đà Nẵng',
        start_date: '2026-09-10',
        end_date: '2026-09-12',
        duration: '3n2d',
        price: 2400000.00,
        capacity: 30,
        rating: 4.9,
        total_reviews: 180,
        latitude: 15.880058,
        longitude: 108.338046,
        main_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR015',
        title: 'Tour Fansipan 2N1Đ - Chinh phục nóc nhà',
        description: 'Chinh phục đỉnh Fansipan với cáp treo và trekking. Thăm vườn quốc gia Hoàng Liên, thác Tả Van. Trải nghiệm homestay, thưởng thức ẩm thực vùng cao.',
        region: 'northern',
        category_id: mountainCat[0]?.id || 2,
        destination: 'Fansipan, Lai Châu',
        departure: 'Hà Nội',
        start_date: '2026-09-20',
        end_date: '2026-09-21',
        duration: '2n1d',
        price: 2200000.00,
        capacity: 20,
        rating: 4.5,
        total_reviews: 70,
        latitude: 22.336360,
        longitude: 103.843785,
        main_image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR018',
        title: 'Tour Hạ Long 2N1Đ - Di sản thế giới UNESCO',
        description: 'Du thuyền sang trọng trên vịnh Hạ Long với hơn 1600 hòn đảo lớn nhỏ. Tham quan hang Sửng Sốt, hang Thiên Cung, đảo Titop, làng chài Cửa Vạn. Thưởng thức buffet hải sản tươi sống. Ngắm hoàng hôn và bình minh tuyệt đẹp trên vịnh.',
        region: 'northern',
        category_id: beachCat[0]?.id || 1,
        destination: 'Hạ Long, Quảng Ninh',
        departure: 'Hà Nội',
        start_date: '2026-05-25',
        end_date: '2026-05-26',
        duration: '2n1d',
        price: 1800000.00,
        capacity: 25,
        rating: 4.7,
        total_reviews: 180,
        latitude: 20.910089,
        longitude: 107.183916,
        main_image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR016',
        title: 'Tour Phú Quốc 5N4Đ - Đảo Ngọc thiên đường',
        description: 'Khám phá đảo Ngọc Phú Quốc với bãi biển hoang sơ tuyệt đẹp. Tham quan VinWonders, Safari, Grand World, Sunset Sanato. Lặn ngắm san hô ở Hòn Thơm, Hòn Móng Tay. Thưởng thức ẩm thực biển phong phú và ghẹ Hàm Ninh nổi tiếng.',
        region: 'southern',
        category_id: beachCat[0]?.id || 1,
        destination: 'Phú Quốc, Kiên Giang',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-06-10',
        end_date: '2026-06-14',
        duration: '5n4d',
        price: 5500000.00,
        capacity: 35,
        rating: 4.9,
        total_reviews: 310,
        latitude: 10.222965,
        longitude: 103.968899,
        main_image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR017',
        title: 'Tour Sapa 3N2Đ - Miền núi Tây Bắc huyền bí',
        description: 'Chinh phục đỉnh Fansipan - nóc nhà Đông Dương bằng cáp treo hiện đại. Tham quan bản Cát Cát, Thác Bạc, Y Tý với ruộng bậc thang tuyệt đẹp. Khám phá văn hóa dân tộc H\'Mông, Dao đỏ. Thưởng thức đặc sản thang cô, cá hồi.',
        region: 'northern',
        category_id: mountainCat[0]?.id || 2,
        destination: 'Sapa, Lào Cai',
        departure: 'Hà Nội',
        start_date: '2026-06-25',
        end_date: '2026-06-27',
        duration: '3n2d',
        price: 3000000.00,
        capacity: 20,
        rating: 4.8,
        total_reviews: 156,
        latitude: 22.336428,
        longitude: 103.843814,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR019',
        title: 'Tour Đà Nẵng - Hội An 4N3Đ - Di sản miền Trung',
        description: 'Khám phá thành phố đáng sống Đà Nẵng với cầu Vàng nổi tiếng, bán đảo Sơn Trà, chùa Linh Ứng. Tham quan phố cổ Hội An - Di sản văn hóa thế giới, thả đèn hoa đăng trên sông Hoài. Tắm biển Mỹ Khê, thưởng thức mì Quảng, cao lầu.',
        region: 'central',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Đà Nẵng - Hội An',
        departure: 'Hà Nội',
        start_date: '2026-07-05',
        end_date: '2026-07-08',
        duration: '4n3d',
        price: 4200000.00,
        capacity: 35,
        rating: 4.9,
        total_reviews: 245,
        latitude: 16.047079,
        longitude: 108.206230,
        main_image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR007',
        title: 'Tour Huế 3N2Đ - Cố đô ngàn năm văn hiến',
        description: 'Khám phá kinh đô Huế với Đại Nội, lăng Khải Định, lăng Tự Đức, chùa Thiên Mụ. Du thuyền sông Hương thưởng thức ca Huế. Thưởng thức ẩm thực cung đình: bún bò Huế, cơm hến, bánh bèo, bánh nậm. Tìm hiểu lịch sử triều Nguyễn.',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Huế, Thừa Thiên Huế',
        departure: 'Đà Nẵng',
        start_date: '2026-07-15',
        end_date: '2026-07-17',
        duration: '3n2d',
        price: 2800000.00,
        capacity: 30,
        rating: 4.7,
        total_reviews: 189,
        latitude: 16.467390,
        longitude: 107.590843,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR008',
        title: 'Tour Ninh Bình 2N1Đ - Vịnh Hạ Long trên cạn',
        description: 'Khám phá Tràng An - Di sản thế giới với hệ thống hang động kỳ vĩ. Đi thuyền qua 9 hang động, chiêm ngưỡng cảnh sắc hùng vĩ. Tham quan chùa Bái Đính, Tam Cốc - Bích Động, động Phượng Hoàng. Leo đỉnh Hang Múa ngắm toàn cảnh.',
        category_id: hikingCat[0]?.id || 4,
        destination: 'Ninh Bình',
        departure: 'Hà Nội',
        start_date: '2026-07-22',
        end_date: '2026-07-23',
        duration: '2n1d',
        price: 1500000.00,
        capacity: 30,
        rating: 4.8,
        total_reviews: 167,
        latitude: 20.253460,
        longitude: 105.974670,
        main_image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR009',
        title: 'Tour Hà Giang 4N3Đ - Chinh phục vùng đất địa đầu Tổ quốc',
        description: 'Khám phá cao nguyên đá Đồng Văn - Công viên địa chất toàn cầu. Chinh phục đèo Mã Pì Lèng, cột cờ Lũng Cú. Tham quan dinh thự Vương, chợ tình Khâu Vai. Thưởng thức đặc sản thắng cố, men mén, rượu ngô.',
        category_id: mountainCat[0]?.id || 2,
        destination: 'Hà Giang',
        departure: 'Hà Nội',
        start_date: '2026-08-05',
        end_date: '2026-08-08',
        duration: '4n3d',
        price: 4500000.00,
        capacity: 15,
        rating: 5.0,
        total_reviews: 98,
        latitude: 22.823111,
        longitude: 104.978524,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR010',
        title: 'Tour Côn Đảo 3N2Đ - Đảo thiêng liêng',
        description: 'Khám phá quần đảo Côn Đảo với bãi biển hoang sơ tuyệt đẹp. Tham quan nhà tù Côn Đảo, nghĩa trang Hàng Dương. Lặn ngắm san hô, thả rùa biển. Thưởng thức hải sản tươi sống. Trải nghiệm không gian yên bình, thiêng liêng.',
        category_id: beachCat[0]?.id || 1,
        destination: 'Côn Đảo, Bà Rịa - Vũng Tàu',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-08-12',
        end_date: '2026-08-14',
        duration: '3n2d',
        price: 6500000.00,
        capacity: 20,
        rating: 4.9,
        total_reviews: 134,
        latitude: 8.683333,
        longitude: 106.616667,
        main_image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR011',
        title: 'Tour Mù Cang Chải 3N2Đ - Mùa lúa chín vàng',
        description: 'Chiêm ngưỡng ruộng bậc thang đẹp nhất Việt Nam trong mùa lúa chín. Tham quan bản Lao Chải, bản Tú Lệ với thung lũng nương tuyệt đẹp. Khám phá văn hóa dân tộc Thái, H\'Mông. Thưởng thức gạo Tú Lệ nổi tiếng, cơm lam.',
        category_id: mountainCat[0]?.id || 2,
        destination: 'Mù Cang Chải, Yên Bái',
        departure: 'Hà Nội',
        start_date: '2026-09-15',
        end_date: '2026-09-17',
        duration: '3n2d',
        price: 3500000.00,
        capacity: 20,
        rating: 4.8,
        total_reviews: 89,
        latitude: 21.833333,
        longitude: 104.066667,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR012',
        title: 'Tour Cần Thơ - Miệt vườn 3N2Đ - Khám phá miền Tây sông nước',
        description: 'Trải nghiệm cuộc sống miệt vườn Nam Bộ. Tham quan chợ nổi Cái Răng, vườn trái cây, làng hoa Sa Đéc. Thưởng thức ẩm thực đặc sản: bánh xèo, lẩu mắm, hủ tiếu. Du thuyền trên sông Hậu, nghe đờn ca tài tử.',
        category_id: culturalCat[0]?.id || 5,
        destination: 'Cần Thơ - Vĩnh Long',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-08-18',
        end_date: '2026-08-20',
        duration: '3n2d',
        price: 2200000.00,
        capacity: 35,
        rating: 4.6,
        total_reviews: 156,
        latitude: 10.034333,
        longitude: 105.724998,
        main_image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR013',
        title: 'Tour Quy Nhơn 4N3Đ - Thiên đường bình yên',
        description: 'Khám phá thành phố biển Quy Nhơn với Eo Gió, Kỳ Co, Hòn Khô. Tham quan tháp Bánh Ít, tháp Đôi Champa cổ kính. Thưởng thức hải sản tươi ngon, bánh xèo tôm nhảy, bánh ít lá gai. Tắm biển, vui chơi tại bãi Xép.',
        category_id: beachCat[0]?.id || 1,
        destination: 'Quy Nhơn, Bình Định',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-08-25',
        end_date: '2026-08-28',
        duration: '4n3d',
        price: 3800000.00,
        capacity: 30,
        rating: 4.7,
        total_reviews: 123,
        latitude: 13.782778,
        longitude: 109.219444,
        main_image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR014',
        title: 'Tour Phan Thiết - Mũi Né 3N2Đ - Sa mạc bên bờ biển',
        description: 'Trải nghiệm đồi cát bay Mũi Né với hoạt động trượt cát thú vị. Ngắm bình minh ở đồi cát trắng, hoàng hôn ở đồi cát đỏ. Tham quan suối tiên, rừng dừa Bảy Mẫu. Thưởng thức bánh căn, bánh xèo, hải sản nướng.',
        category_id: beachCat[0]?.id || 1,
        destination: 'Phan Thiết - Mũi Né',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-09-05',
        end_date: '2026-09-07',
        duration: '3n2d',
        price: 2600000.00,
        capacity: 40,
        rating: 4.5,
        total_reviews: 201,
        latitude: 10.928333,
        longitude: 108.105833,
        main_image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        tour_code: 'TOUR015',
        title: 'Tour Tây Nguyên 5N4Đ - Đại ngàn xanh ngát',
        description: 'Khám phá Tây Nguyên với Pleiku, Kon Tum, Buôn Ma Thuột. Tham quan hồ T\'Nưng, biển Hồ, thác Dray Nur. Trải nghiệm văn hóa cồng chiêng - Di sản văn hóa phi vật thể. Thưởng thức cà phê Buôn Ma Thuột, rượu cần.',
        category_id: hikingCat[0]?.id || 4,
        destination: 'Tây Nguyên (Gia Lai - Kon Tum - Đắk Lắk)',
        departure: 'TP. Hồ Chí Minh',
        start_date: '2026-09-22',
        end_date: '2026-09-26',
        duration: '5n4d',
        price: 5200000.00,
        capacity: 25,
        rating: 4.8,
        total_reviews: 87,
        latitude: 13.983333,
        longitude: 108.000000,
        main_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // Xóa category_id khỏi tours vì bảng tours không còn cột này (dùng tour_categories junction table)
    const toursInsertData = toursSeedData.map(({ category_id, ...tour }) => tour);

    // Insert tours với ON DUPLICATE KEY để tránh duplicate
    for (const tour of toursInsertData) {
      // Set default region if missing
      if (!tour.region) {
        if (tour.destination.includes('Hà Nội') || tour.destination.includes('Sapa') || tour.destination.includes('Hạ Long') || tour.destination.includes('Sa Pa')) {
          tour.region = 'northern';
        } else if (tour.destination.includes('Đà Nẵng') || tour.destination.includes('Hội An') || tour.destination.includes('Huế') || tour.destination.includes('Nha Trang')) {
          tour.region = 'central';
        } else {
          tour.region = 'southern';
        }
      }
      await queryInterface.sequelize.query(
        `INSERT INTO tours (tour_code, title, description, region, destination, departure, start_date, end_date, duration, price, capacity, rating, total_reviews, latitude, longitude, main_image, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           region = VALUES(region),
           destination = VALUES(destination),
           departure = VALUES(departure),
           start_date = VALUES(start_date),
           end_date = VALUES(end_date),
           duration = VALUES(duration),
           price = VALUES(price),
           capacity = VALUES(capacity),
           rating = VALUES(rating),
           total_reviews = VALUES(total_reviews),
           latitude = VALUES(latitude),
           longitude = VALUES(longitude),
           main_image = VALUES(main_image),
           is_active = VALUES(is_active),
           updated_at = VALUES(updated_at)`,
        {
          replacements: [
            tour.tour_code,
            tour.title,
            tour.description,
            tour.region,
            tour.destination,
            tour.departure,
            tour.start_date,
            tour.end_date,
            tour.duration,
            tour.price,
            tour.capacity,
            tour.rating,
            tour.total_reviews,
            tour.latitude,
            tour.longitude,
            tour.main_image,
            tour.is_active
          ]
        }
      );
    }
    console.log('✅ Đã tạo 15 tours');

    // Lấy tour IDs vừa tạo theo tour_code
    const tourCodes = toursSeedData.map(t => t.tour_code);
    const placeholders = tourCodes.map(() => '?').join(',');
    const [tourRows] = await queryInterface.sequelize.query(
      `SELECT id, tour_code FROM tours WHERE tour_code IN (${placeholders})`,
      { replacements: tourCodes }
    );

    const tourIdMap = {};
    tourRows.forEach(row => {
      tourIdMap[row.tour_code] = row.id;
    });

    const tourEntries = toursSeedData
      .map(tour => ({
        ...tour,
        id: tourIdMap[tour.tour_code],
      }))
      .filter(tour => tour.id);

    const tourIds = tourEntries.map(tour => tour.id);

    // Gán categories cho tours (tour_categories bây giờ có id làm primary key thay vì composite key)
    const tourCategoriesData = tourEntries
      .map(tour => ({
        tour_id: tour.id,
        category_id: tour.category_id,
      }))
      .filter(item => item.tour_id && item.category_id);

    if (tourCategoriesData.length > 0) {
      // Insert vào tour_categories (id sẽ tự động tăng)
      await queryInterface.bulkInsert('tour_categories', tourCategoriesData, {});
      console.log(`✅ Đã gán ${tourCategoriesData.length} tour categories`);
    }

    // ========== 6. TOUR GALLERY ==========
    console.log('🔄 Seeding Tour Gallery...');
    const galleryData = [];
    tourEntries.forEach((tour, index) => {
      const tourId = tour.id;
      // Mỗi tour có 3-5 ảnh
      const numImages = 3 + (index % 3);
      for (let i = 1; i <= numImages; i++) {
        galleryData.push({
          tour_id: tourId,
          image_url: `https://images.unsplash.com/photo-${1500000000000 + index * 1000 + i}?w=800`,
          created_at: now,
          updated_at: now,
        });
      }
    });
    await queryInterface.bulkInsert('tour_gallery', galleryData, {});
    console.log(`✅ Đã tạo ${galleryData.length} tour gallery images`);

    // ========== 7. TOUR SCHEDULES ==========
    console.log('🔄 Seeding Tour Schedules...');
    const scheduleTemplates = {
      2: [
        { day: 1, title: 'Ngày 1: Khởi hành - Tham quan', detail: 'Khởi hành từ điểm hẹn. Tham quan các điểm đến chính. Dùng bữa trưa và tối. Nghỉ đêm tại khách sạn.' },
        { day: 2, title: 'Ngày 2: Tham quan - Về', detail: 'Ăn sáng tại khách sạn. Tiếp tục tham quan các điểm còn lại. Mua sắm đặc sản. Trở về điểm xuất phát.' },
      ],
      3: [
        { day: 1, title: 'Ngày 1: Khởi hành - Check in', detail: 'Khởi hành từ điểm hẹn. Di chuyển đến điểm đến. Check-in khách sạn. Tự do khám phá. Nghỉ đêm.' },
        { day: 2, title: 'Ngày 2: Tham quan chính', detail: 'Ăn sáng buffet. Tham quan các điểm đến chính trong ngày. Ăn trưa và tối. Tự do vào buổi tối. Nghỉ đêm.' },
        { day: 3, title: 'Ngày 3: Tham quan - Trở về', detail: 'Ăn sáng. Check-out khách sạn. Tham quan các điểm còn lại. Mua sắm quà lưu niệm. Trở về điểm xuất phát.' },
      ],
      4: [
        { day: 1, title: 'Ngày 1: Khởi hành', detail: 'Khởi hành từ điểm hẹn. Di chuyển đến điểm đến. Nhận phòng khách sạn. Nghỉ ngơi. Tự do khám phá buổi tối.' },
        { day: 2, title: 'Ngày 2: Khám phá điểm đến A', detail: 'Ăn sáng. Tham quan điểm đến A với các hoạt động đặc sắc. Ăn trưa tại nhà hàng. Tiếp tục hành trình. Nghỉ đêm.' },
        { day: 3, title: 'Ngày 3: Khám phá điểm đến B', detail: 'Ăn sáng. Tham quan điểm đến B. Trải nghiệm các hoạt động thú vị. Ăn trưa và tối. Thời gian tự do. Nghỉ đêm.' },
        { day: 4, title: 'Ngày 4: Tham quan - Về', detail: 'Ăn sáng. Check-out. Tham quan điểm cuối. Mua sắm. Trở về điểm xuất phát kết thúc chuyến đi.' },
      ],
      5: [
        { day: 1, title: 'Ngày 1: Khởi hành - Check in', detail: 'Khởi hành. Di chuyển đến điểm đến. Check-in khách sạn. Nghỉ ngơi thư giãn.' },
        { day: 2, title: 'Ngày 2: Tham quan A', detail: 'Tham quan khu vực A với các điểm nổi bật. Trải nghiệm văn hóa địa phương.' },
        { day: 3, title: 'Ngày 3: Tham quan B', detail: 'Khám phá khu vực B. Tham gia các hoạt động đặc sắc. Thưởng thức ẩm thực địa phương.' },
        { day: 4, title: 'Ngày 4: Tham quan C', detail: 'Tham quan khu vực C. Mua sắm quà lưu niệm. Thời gian tự do.' },
        { day: 5, title: 'Ngày 5: Tham quan - Trở về', detail: 'Tham quan điểm cuối. Check-out. Trở về điểm xuất phát.' },
      ],
    };

    const scheduleData = [];
    tourEntries.forEach((tour) => {
      const tourId = tour.id;
      if (!tourId) {
        return;
      }
      // Parse duration string định dạng "3n2d" để lấy số ngày chính
      const durationValue = typeof tour.duration === 'string' ? tour.duration : String(tour.duration ?? '');
      const durationDays = parseInt(durationValue, 10) || 3;
      const template = scheduleTemplates[durationDays] || scheduleTemplates[3];
      
      template.forEach(sched => {
        scheduleData.push({
          tour_id: tourId,
          day_number: sched.day,
          title: sched.title,
          detail: sched.detail,
          created_at: now,
          updated_at: now,
        });
      });
    });
    await queryInterface.bulkInsert('tour_schedule', scheduleData, {});
    console.log(`✅ Đã tạo ${scheduleData.length} tour schedules`);

    // ========== 8. TOUR INCLUDES ==========
    console.log('🔄 Seeding Tour Includes...');
    const includesData = [];
    tourEntries.forEach(tour => {
      const tourId = tour.id;
      const items = [
        'Vé tham quan theo chương trình',
        'Khách sạn 3-4 sao, phòng 2-3 người',
        'Các bữa ăn theo chương trình',
        'Xe du lịch đời mới, máy lạnh',
        'Hướng dẫn viên nhiệt tình, kinh nghiệm',
        'Bảo hiểm du lịch mức 100.000.000đ/vụ',
        'Nước uống trên xe',
        'Nón du lịch',
      ];
      items.forEach(item => {
        includesData.push({
          tour_id: tourId,
          item: item,
          created_at: now,
          updated_at: now,
        });
      });
    });
    await queryInterface.bulkInsert('tour_includes', includesData, {});
    console.log(`✅ Đã tạo ${includesData.length} tour includes`);

    // ========== 9. TOUR EXCLUDES ==========
    console.log('🔄 Seeding Tour Excludes...');
    const excludesData = [];
    tourEntries.forEach(tour => {
      const tourId = tour.id;
      const items = [
        'Vé máy bay/tàu hỏa khứ hồi',
        'Chi phí cá nhân ngoài chương trình',
        'Thuế VAT',
        'Đồ uống có cồn',
        'Phụ thu phòng đơn',
        'Tip hướng dẫn viên và lái xe',
      ];
      items.forEach(item => {
        excludesData.push({
          tour_id: tourId,
          item: item,
          created_at: now,
          updated_at: now,
        });
      });
    });
    await queryInterface.bulkInsert('tour_excludes', excludesData, {});
    console.log(`✅ Đã tạo ${excludesData.length} tour excludes`);

    // ========== 10. COUPONS ==========
    console.log('🔄 Seeding Coupons...');
    await queryInterface.bulkInsert('coupons', [
      {
        code: 'WELCOME2026',
        description: 'Chào mừng khách hàng mới - Giảm 10%',
        discount_percent: 10,
        discount_amount: null,
        expire_at: '2026-12-31',
        max_use: 100,
        discount_limit: 1000000,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: 'SUMMER2026',
        description: 'Khuyến mãi mùa hè - Giảm 500K',
        discount_percent: null,
        discount_amount: 500000.00,
        expire_at: '2026-08-31',
        max_use: 50,
        discount_limit: 2000000,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: 'TET2026',
        description: 'Đón Tết Nguyên Đán 2026 - Giảm 15%',
        discount_percent: 15,
        discount_amount: null,
        expire_at: '2027-02-15',
        max_use: 200,
        discount_limit: 1500000,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: 'FAMILY2026',
        description: 'Tour gia đình - Giảm 1 triệu',
        discount_percent: null,
        discount_amount: 1000000.00,
        expire_at: '2026-12-30',
        max_use: 30,
        discount_limit: 1000000,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: 'STUDENT2026',
        description: 'Ưu đãi sinh viên - Giảm 20%',
        discount_percent: 20,
        discount_amount: null,
        expire_at: '2026-12-31',
        max_use: 150,
        discount_limit: 2000000,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: 'FLASH50',
        description: 'Flash Sale - Giảm ngay 50%',
        discount_percent: 50,
        discount_amount: null,
        expire_at: '2026-06-01',
        max_use: 10,
        discount_limit: 500000,
        is_active: false,
        created_at: now,
        updated_at: now,
      },
    ], {});
    console.log('✅ Đã tạo 6 coupons');

    // ========== 11. ORDERS ==========
    console.log('🔄 Seeding Orders...');
    const [users] = await queryInterface.sequelize.query("SELECT id FROM users ORDER BY id ASC");
    const userIds = users.map(u => u.id);
    
    const ordersData = [];
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    
    if (tourEntries.length > 0) {
      // Tạo 30 orders ngẫu nhiên
      for (let i = 0; i < 30; i++) {
        const userId = userIds[i % userIds.length];
        const tourIndex = i % tourEntries.length;
        const tour = tourEntries[tourIndex];
        if (!tour) {
          continue;
        }
        const tourId = tour.id;
        const quantity = 1 + (i % 4);
        const status = statuses[i % 4];
        const isPaid = status !== 'pending' && status !== 'cancelled';
        
        ordersData.push({
          order_code: `ORD${String(i + 1).padStart(6, '0')}`,
          user_id: userId,
          tour_id: tourId,
          quantity: quantity,
          total_price: parseFloat(tour.price) * quantity,
          status: status,
          start_date: tour.start_date,
          end_date: tour.end_date,
          payment_url: isPaid ? `https://payment.example.com/success/${i}` : `https://payment.example.com/pending/${i}`,
          is_paid: isPaid,
          is_review: status === 'completed' && (i % 2 === 0),
          created_at: now,
          updated_at: now,
        });
      }
      await queryInterface.bulkInsert('orders', ordersData, {});
      console.log('✅ Đã tạo 30 orders');
    } else {
      console.log('⚠️ Không có tour nào để tạo orders.');
    }

    // ========== 12. REVIEWS ==========
    console.log('🔄 Seeding Reviews...');
    const reviewsData = [];
    const reviewComments = [
      'Tour rất tuyệt vời! Hướng dẫn viên nhiệt tình, thân thiện. Khách sạn sạch sẽ, đồ ăn ngon.',
      'Chuyến đi đáng nhớ với gia đình. Lịch trình hợp lý, không quá gấp gáp.',
      'Điểm đến đẹp như mơ! Sẽ quay lại lần sau. Giá cả hợp lý.',
      'Trải nghiệm tuyệt vời. Phong cảnh đẹp, ẩm thực đặc sắc.',
      'Hài lòng với chuyến đi. Dịch vụ chuyên nghiệp, chu đáo.',
      'Tour được tổ chức tốt. Mọi thứ đều ổn. Recommend!',
      'Chuyến đi hoàn hảo! Không có gì để chê. 5 sao xứng đáng.',
      'Cảnh đẹp, không khí trong lành. Nghỉ dưỡng tuyệt vời.',
      'Tour phù hợp cho gia đình. Trẻ em rất thích. Sẽ đi lại.',
      'Giá hơi cao nhưng chất lượng xứng đáng. Đáng tiền!',
    ];

    // Tạo reviews cho các tours (mỗi tour có 5-12 reviews)
    tourEntries.forEach((tour, index) => {
      const tourId = tour.id;
      const numReviews = 5 + (index % 8);
      for (let i = 0; i < numReviews; i++) {
        const userId = userIds[(index * 7 + i) % userIds.length];
        const rating = 3 + (i % 3); // Rating từ 3-5
        reviewsData.push({
          user_id: userId,
          tour_id: tourId,
          rating: rating,
          text: reviewComments[i % reviewComments.length],
          created_at: new Date(now.getTime() - (i * 86400000)), // Mỗi review cách nhau 1 ngày
        });
      }
    });
    if (reviewsData.length > 0) {
      await queryInterface.bulkInsert('reviews', reviewsData, {});
    }
    console.log(`✅ Đã tạo ${reviewsData.length} reviews`);

    // ========== 13. TICKETS ==========
    console.log('🔄 Seeding Tickets...');
    const [orders] = await queryInterface.sequelize.query(
      "SELECT id, user_id, quantity, start_date, end_date, is_paid, status FROM orders ORDER BY id ASC"
    );
    
    const ticketsData = [];
    const ticketStatuses = ['active', 'used', 'cancelled'];
    
    orders.forEach((order, orderIndex) => {
      // Chỉ tạo tickets cho orders đã thanh toán
      if (order.is_paid) {
        // Tạo số lượng tickets theo quantity của order
        for (let i = 0; i < order.quantity; i++) {
          // Xác định status của ticket dựa trên status của order
          let ticketStatus = 'active';
          if (order.status === 'completed') {
            // Một số tickets đã sử dụng, một số vẫn active
            ticketStatus = i % 3 === 0 ? 'used' : 'active';
          } else if (order.status === 'cancelled') {
            ticketStatus = 'cancelled';
          }
          
          ticketsData.push({
            order_id: order.id,
            user_id: order.user_id,
            ticket_code: `TKT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(orderIndex * 10 + i + 1).padStart(4, '0')}`,
            issue_date: now,
            valid_from: order.start_date,
            valid_until: order.end_date,
            status: ticketStatus,
            created_at: now,
            updated_at: now,
          });
        }
      }
    });
    
    await queryInterface.bulkInsert('tickets', ticketsData, {});
    console.log(`✅ Đã tạo ${ticketsData.length} tickets`);

    console.log('\n🎉 =================================');
    console.log('🎉 Seeding hoàn tất!');
    console.log('🎉 =================================');
    console.log('📊 Tổng kết:');
    console.log('   - 2 Admins');
    console.log('   - 5 Categories');
    console.log('   - 10 Users');
    console.log('   - 15 Tours');
    console.log(`   - ${galleryData.length} Tour Gallery Images`);
    console.log(`   - ${scheduleData.length} Tour Schedules`);
    console.log(`   - ${includesData.length} Tour Includes`);
    console.log(`   - ${excludesData.length} Tour Excludes`);
    console.log('   - 6 Coupons');
    console.log('   - 30 Orders');
    console.log(`   - ${reviewsData.length} Reviews`);
    console.log(`   - ${ticketsData.length} Tickets`);
    console.log('🎉 =================================\n');
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa theo thứ tự ngược lại để tránh lỗi foreign key
    await queryInterface.bulkDelete('tickets', null, {});
    await queryInterface.bulkDelete('review_images', null, {});
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('orders', null, {});
    await queryInterface.bulkDelete('coupons', null, {});
    await queryInterface.bulkDelete('tour_excludes', null, {});
    await queryInterface.bulkDelete('tour_includes', null, {});
    await queryInterface.bulkDelete('tour_schedule', null, {});
    await queryInterface.bulkDelete('tour_gallery', null, {});
    await queryInterface.bulkDelete('tour_categories', null, {});
    await queryInterface.bulkDelete('tours', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('admins', null, {});
    console.log('✅ Đã xóa tất cả seeded data');
  }
};
