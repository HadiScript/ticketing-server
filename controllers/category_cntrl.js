const Category = require("../models/category_schema");
const sendError = require("../utils/Error");

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return sendError(res, "All required fields must be filled", 400);

    const categoryExist = await Category.findOne({ name });
    if (categoryExist) return res.json({ error: "Duplication is not allowed" });
    else if (!categoryExist) {
      const newCategory = new Category({ name });
      await newCategory.save();

      return res.status(201).json({
        message: "Category created successfully",
        category: newCategory,
      });
    }
  } catch (error) {
    sendError(res, "Error while creating category");
  }
};

const EditCategory = async (req, res) => {
  try {
    const { _id, name } = req.body;
    if (!_id || !name)
      return sendError(res, "All required fields must be filled", 400);

    const updatedCategory = await Category.findByIdAndUpdate(
      _id,
      { name },
      { new: true }
    );

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    sendError(res, "Error while updating category");
  }
};

const getAllCategories = async (req, res) => {
  try {
    const allCategories = await Category.find({});
    return res.status(200).json({ categories: allCategories });
  } catch (error) {
    sendError(res, "Error while fetching categories");
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { _id } = req.params;
    await Category.findByIdAndRemove(_id);
    return res
      .status(200)
      .json({ message: "Category has been removed", ok: true });
  } catch (error) {
    sendError(res, "Error while deleting category");
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  EditCategory,
  deleteCategory,
};
