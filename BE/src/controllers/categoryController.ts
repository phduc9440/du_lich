import { Request, Response } from 'express';
import categoryService from '../services/categoryService';
import { sendSuccess, sendError } from '../utils/responseHandler';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const categories = await categoryService.getAllCategories(search);
    sendSuccess(res, 'Lấy danh mục thành công', categories);
  } catch (error: any) {
    sendError(res, error.message || 'Không thể lấy danh mục', 500);
  }
};

// POST /api/categories - Tạo danh mục mới
export const createCategory = async (req: Request, res: Response) => {
  try {
    // Validate category
    if (!req.body.category || typeof req.body.category !== 'string' || req.body.category.trim() === '') {
      return sendError(res, 'Tên danh mục là bắt buộc', 400);
    }

    const categoryName = req.body.category.trim();
    
    // Validate độ dài category (theo model là STRING(50))
    if (categoryName.length > 50) {
      return sendError(res, 'Tên danh mục không được vượt quá 50 ký tự', 400);
    }

    // Description là optional, nhưng nếu có thì phải là string
    let description: string | undefined;
    if (req.body.description !== undefined) {
      if (typeof req.body.description !== 'string') {
        return sendError(res, 'Mô tả phải là chuỗi', 400);
      }
      description = req.body.description.trim() || undefined;
    }

    const categoryData = {
      category: categoryName,
      description: description,
    };

    const newCategory = await categoryService.createCategory(categoryData);
    sendSuccess(res, 'Tạo danh mục thành công', newCategory, undefined, 201);
  } catch (error: any) {
    // Xử lý lỗi unique constraint (danh mục đã tồn tại)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Danh mục này đã tồn tại', 400);
    }
    sendError(res, error.message || 'Không thể tạo danh mục', 500);
  }
};

// PUT /api/categories/:id - Cập nhật danh mục
export const updateCategory = async (req: Request, res: Response) => {
  try {
    // Validate ID
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return sendError(res, 'ID danh mục không hợp lệ', 400);
    }

    // Validate category
    if (!req.body.category || typeof req.body.category !== 'string' || req.body.category.trim() === '') {
      return sendError(res, 'Tên danh mục là bắt buộc', 400);
    }

    const categoryName = req.body.category.trim();
    
    // Validate độ dài category (theo model là STRING(50))
    if (categoryName.length > 50) {
      return sendError(res, 'Tên danh mục không được vượt quá 50 ký tự', 400);
    }

    // Description là optional, nhưng nếu có thì phải là string
    let description: string | undefined;
    if (req.body.description !== undefined) {
      if (typeof req.body.description !== 'string') {
        return sendError(res, 'Mô tả phải là chuỗi', 400);
      }
      description = req.body.description.trim() || undefined;
    }

    const categoryData = {
      category: categoryName,
      description: description,
    };

    const updatedCategory = await categoryService.updateCategory(id, categoryData);
    sendSuccess(res, 'Cập nhật danh mục thành công', updatedCategory);
  } catch (error: any) {
    // Xử lý lỗi unique constraint (danh mục đã tồn tại)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Danh mục này đã tồn tại', 400);
    }
    sendError(res, error.message || 'Không thể cập nhật danh mục', 500);
  }
};

// DELETE /api/categories/:id - Xóa danh mục (Hard Delete)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    // Validate ID
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return sendError(res, 'ID danh mục không hợp lệ', 400);
    }

    const result = await categoryService.deleteCategory(id);
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message || 'Không thể xóa danh mục', 500);
  }
};


