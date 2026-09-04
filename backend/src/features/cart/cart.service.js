import { cartFullDTO } from "../../common/dtos/cart.js";
import { productCartDTO } from "../../common/dtos/product.js";
import AppError from "../../common/utilities/error.js";
import CartRepository from "./cart.repository.js";
import CartItemRepository from "./cart_item/cart_item.repository.js";
import UserModel from "../user/user.repository.js";

export const CartService = {
  // Trace point: ensureUserExists()
  async ensureUserExists(userId, conn = null) {
    const user = await UserModel.findById(userId, conn);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  // Trace point: getOrCreate()
  async getOrCreate(userId, conn = null) {
    await this.ensureUserExists(userId, conn);

    let cart = await CartRepository.findByUserId(userId, conn);

    if (!cart) {
      const result = await CartRepository.createForUser(userId, conn);
      cart = {id: result.insertId};
    }

    return cart;
  },

  // Trace point: getCart()
  async getCart(userId, conn = null) {
    await this.ensureUserExists(userId, conn);

    const result = await CartRepository.findFullByUserId(userId, conn);

    if (!result || result.length === 0) {
      await CartRepository.createForUser(userId, conn);
      return cartFullDTO([]);
    }

    return cartFullDTO(result);
  },

  // Trace point: getCheckoutCart()
  async getCheckoutCart(userId, conn) {
    await this.ensureUserExists(userId, conn);

    const result = await CartRepository.findCheckoutItemsByUserId(userId, conn);
    return cartFullDTO(result);
  },

  // Trace point: addProduct()
  async addProduct(userId, productId, quantity) {

    const cart = await this.getOrCreate(userId);

    const existingItem = await CartItemRepository.findItemByCartId(
      cart.id,
      productId
    );
    
    
    let cart_item;

    if (!existingItem) {
      cart_item = await CartItemRepository.create({
        cart_id: cart.id,
        product_id: productId,
        quantity
      });
    } else {
      cart_item = await CartItemRepository.updateItemQuantityByCartId(
        cart.id,
        productId,
        quantity
      );
    }

    if (!cart_item) throw new Error("Failed to add product");

    return this.getCart(userId);
  },

  // Trace point: updateProductQuantity()
  async updateProductQuantity(userId, productId, quantity) {

    const cart = await this.getOrCreate(userId);

    const existing = await CartItemRepository.findItemByCartId(
      cart.id,
      productId
    );

    if (!existing) throw new Error("Item not found in cart");

    await CartItemRepository.updateItemQuantityByCartId(
      cart.id,
      productId,
      quantity
    );

    return this.getCart(userId);
  },

  // Trace point: deleteProduct()
  async deleteProduct(userId, productId) {

      const cart = await this.getOrCreate(userId);

      await CartItemRepository.deleteItemByCartId(cart.id, productId);

      return this.getCart(userId);
  },

  // Trace point: deleteCart()
  async deleteCart(userId, conn = null) {
    await this.ensureUserExists(userId, conn);

    const cart = await CartRepository.findByUserId(userId, conn);
    if (!cart) throw new Error("Cart not found");

    await CartItemRepository.deleteByCartId(cart.id, conn);
    await CartRepository.delete(cart.id, conn);

    return true;
  }
};
