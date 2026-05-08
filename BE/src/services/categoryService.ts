import Category from '../models/Category';
import { Op } from 'sequelize';

class CategoryService {
  async getAllCategories(search?: string) {
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { category: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const categories = await Category.findAll({
      where,
      order: [['category', 'ASC']],
    });

    return categories.map((category) => category.toJSON());
  }

  async createCategory(categoryData: { category: string; description?: string }) {
    const category = await Category.create(categoryData);
    return category.toJSON();
  }

  async updateCategory(id: number, categoryData: { category: string; description?: string }) {
    const category = await Category.findByPk(id);
    
    if (!category) {
      throw new Error('Danh mục không tồn tại');
    }

    await category.update(categoryData);
    return category.toJSON();
  }

  async deleteCategory(id: number) {
    const category = await Category.findByPk(id);
    
    if (!category) {
      throw new Error('Danh mục không tồn tại');
    }

    await category.destroy();
    return { message: 'Xóa danh mục thành công' };
  }
}

export default new CategoryService();


