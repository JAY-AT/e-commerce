import { categoryDTO } from "../../common/dtos/category.js";
import { productListDTO, productDetailDTO, productDTO } from "../../common/dtos/product.js";
import AppError from "../../common/utilities/error.js";
import { withTransaction } from "../../common/utilities/handler.js";
import ProductRepository from "./product.repository.js";

const normalizeImageUrl = (value) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return null;
  }

  if (/^(https?:\/\/|\/assets\/)/i.test(trimmed)) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  if (/^assets\//i.test(trimmed)) {
    return `/${trimmed}`;
  }

  if (/^images\//i.test(trimmed)) {
    return `/assets/${trimmed}`;
  }

  const cleaned = trimmed.replace(/^\.?\/*/, '');
  return `/assets/images/${cleaned}`;
};

const mapDuplicateProductError = (err) => {
  if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) {
    throw new AppError("Product name already exists", 409);
  }

  throw err;
};

export const ProductService = {
  async getAllProducts() {
        const rows = await ProductRepository.findAllFull();

        const map = new Map();

        for (const row of rows) {
            if (!map.has(row.product_id)) {
                map.set(row.product_id, {
                    product: {
                        id: row.product_id,
                        name: row.name,
                        price: row.price,
                        stock: row.stock,
                        category_name: row.category_name
                    },
                    image: null
                });
            }

            const item = map.get(row.product_id);

            if (row.image_id && !item.image) {
                item.image = {
                    image_url: row.image_url
                };
            }
        }

        return [...map.values()].map(item =>
            productListDTO(item.product, item.image)
        );
    },

  async getProductById(id) {
        const rows = await ProductRepository.findFullById(id);

        if (!rows || rows.length === 0) return null;

        const first = rows[0];

        const product = productDTO(first);
        
        const category = categoryDTO(first);

        const images = rows
            .filter(r => r.image_id)
            .map(r => ({
                id: r.image_id,
                image_url: r.image_url
            }));
        return productDetailDTO(product, category, images);
    },

  async createProduct(data) {
  const existing = await ProductRepository.findByName(data.name);

  if (existing) {
    throw new AppError("Product name already exists", 409);
  }

  try {
    const productId = await withTransaction(
      ProductRepository.pool,
      async (conn) => {
        const productResult = await ProductRepository.create(
          {
            name: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock,
            category_id: data.category_id,
          },
          conn
        );

        const imageUrl = normalizeImageUrl(data.image_url);

        if (imageUrl) {
          await conn.query(
            `INSERT INTO product_images (product_id, image_url, is_primary)
             VALUES (?, ?, TRUE)`,
            [productResult.insertId, imageUrl]
          );
        }

        return productResult.insertId; // 👈 return only ID
      }
    );

    console.log("Product created with ID:", productId);

    // 👇 fetch AFTER transaction is committed
    return ProductService.getProductById(productId);

  } catch (err) {
    mapDuplicateProductError(err);
  }
},

  async updateProduct(id, data) {
    const productId = Number(id);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      throw new AppError("A valid product ID is required", 422);
    }

    const product = await ProductRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);

    if (Object.prototype.hasOwnProperty.call(data, "name")) {
      const existing = await ProductRepository.findByNameExceptId(data.name, productId);

      if (existing) {
        throw new AppError("Product name already exists", 409);
      }
    }

    try {
      console.log("Updating product stock/details:", {
        productId,
        stock: data.stock,
      });

      const updated = await ProductRepository.update(productId, data);

      if (!updated) {
        throw new AppError("Product not found", 404);
      }

      const updatedProduct = await ProductService.getProductById(productId);

      if (!updatedProduct) {
        throw new AppError("Product not found after update", 404);
      }

      return updatedProduct;
    } catch (err) {
      mapDuplicateProductError(err);
    }
  },

  async deleteProduct(id) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new Error("Product not found");

    return await ProductRepository.delete(id);
  },
};
