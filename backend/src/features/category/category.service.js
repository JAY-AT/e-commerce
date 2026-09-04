import CategoryRepository from "./category.repository.js";

export const CategoryService = {
    // Trace point: getAllCategories()
    async getAllCategories() {
        return await CategoryRepository.findAll();
    },

    // Trace point: getCategoryById()
    async getCategoryById(id) {
        const category = await CategoryRepository.findById(id);
        if (!category) throw new Error("Category not found");
        return category;
    },

    // Trace point: createCategory()
    async createCategory(data) {
        return await CategoryRepository.create(data);
    },

    // Trace point: updateCategory()
    async updateCategory(id, data) {
        const category = await CategoryRepository.findById(id);
        if (!category) throw new Error("Category not found");

        return await CategoryRepository.update(id, data);
    },

    // Trace point: deleteCategory()
    async deleteCategory(id) {
        const category = await CategoryRepository.findById(id);
        if (!category) throw new Error("Category not found");

        return await CategoryRepository.delete(id);
    }
};

