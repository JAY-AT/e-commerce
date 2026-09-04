import QRCode from "qrcode";
import AppError from "../../common/utilities/error.js";
import { CartService } from "../cart/cart.service.js";
import { productCartDTO } from "../../common/dtos/product.js";
import {
    orderItemFullDTO,
    orderListDTO,
    orderDetailDTO
} from "../../common/dtos/order.js";

import { requiredOneOf } from "../../common/validation/fields.js";
import { createOrderNotif, createPaymentNotif, handleAdminUpdateNotification, handleCustomerUpdateNotification, customNotification} from "../notification/notification.service.js";
import OrderRepository from "./order.repository.js";
import OrderItemRepository from "./order_items/order_items.repository.js";
import ProductRepository from "../products/product.repository.js";
import PaymentsRepository from "../payment/payment.repository.js";
import { withTransaction } from "../../common/utilities/handler.js";

export default class OrderService {

    // 🔹 1. BUILD ORDER DATA ONLY (NO DB SIDE EFFECTS)
    async buildOrderFromCart(userId, shipping_addr, conn) {
        const cart = await CartService.getCheckoutCart(userId, conn);

        
        if (!cart.products?.length || cart.products[0].product_id === null) {
            throw new AppError("Cart is empty", 400);
        }

        const itemsByProductId = new Map();

        cart.products.forEach((p) => {
            const item = productCartDTO(p);
            if (!item.product_id || itemsByProductId.has(item.product_id)) return;
            itemsByProductId.set(item.product_id, item);
        });

        const items = [...itemsByProductId.values()];

        if (items.length === 0) {
            throw new AppError("Cart is empty", 400);
        }

        const total_amount = items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        );
        
        return {
            user_id: userId,
            total_amount,
            shipping_addr,
            items
        };
    }

    // 🔹 2. CREATE ORDER (ATOMIC)
    async validateAndReserveStock(items, conn) {
        const productIds = items.map(item => item.product_id);
        const products = await ProductRepository.findStocksForUpdate(productIds, conn);
        const productsById = new Map(products.map(product => [Number(product.id), product]));

        for (const item of items) {
            const product = productsById.get(Number(item.product_id));

            if (!product) {
                throw new AppError(`Product #${item.product_id} is no longer available`, 404);
            }

            if (Number(product.stock) < Number(item.quantity)) {
                throw new AppError(
                    `${product.name} only has ${product.stock} item(s) left in stock`,
                    400
                );
            }
        }

        for (const item of items) {
            const updated = await ProductRepository.decrementStock(
                item.product_id,
                item.quantity,
                conn
            );

            if (!updated) {
                throw new AppError(`Insufficient stock for product #${item.product_id}`, 400);
            }
        }
    }

    // Trace point: createOrder()
    async createOrder(userId, data) {
        const { shipping_addr } = data;

        const order = await withTransaction(OrderRepository.pool, async (conn) => {

            // 1. build order
            const orderData = await this.buildOrderFromCart(userId, shipping_addr, conn);

            await this.validateAndReserveStock(orderData.items, conn);

            // 2. create order
            const result = await OrderRepository.create({ 
                user_id: orderData.user_id,
                total_amount: orderData.total_amount,
                status: "pending",
                shipping_addr: orderData.shipping_addr
            }, conn);

            if (!result || result.affectedRows === 0) {
                throw new AppError("Order failed to create", 500);
            }

            const orderId = result.insertId;

            // 3. insert order items
            await OrderItemRepository.createBulk(orderId, orderData.items, conn);

            // 4. clear cart
            await CartService.deleteCart(userId, conn);

            // 5. fetch full order (JOIN)
            const rows = await OrderRepository.findFullById(orderId, conn);

            return orderDetailDTO(rows);
        });

        try {
            await createOrderNotif(order.id, userId);
        } catch (error) {
            console.error("Failed to create order notification", error);
        }

        return order;
    }

    // Trace point: generatePublicOrderQrCode()
    async generatePublicOrderQrCode(orderId) {
        const paymentUrl = `http://localhost:4200/pay/${orderId}`;
        const qrCodeImage = await QRCode.toDataURL(paymentUrl);

        return {
            orderId,
            paymentUrl,
            qrCode: qrCodeImage,
            mimeType: "image/png"
        };
    }

    // Trace point: generateOrderQrCode()
    async generateOrderQrCode(userId, orderId) {
        const rows = await OrderRepository.findFullById(orderId);

        if (!rows || rows.length === 0) {
            throw new AppError("Order not found", 404);
        }

        if (rows[0].user_id !== userId) {
            throw new AppError("Unauthorized access to order", 403);
        }

        const qrCode = await this.generatePublicOrderQrCode(orderId);

        return {
            ...qrCode,
            total_amount: Number(rows[0].total_amount),
        };
    }

    // Trace point: confirmOrderPayment()
    async confirmOrderPayment(userId, orderId) {
        const rows = await OrderRepository.findFullById(orderId);

        if (!rows || rows.length === 0) {
            throw new AppError("Order not found", 404);
        }

        if (rows[0].user_id !== userId) {
            throw new AppError("Unauthorized access to order", 403);
        }

        if (rows[0].status === "paid") {
            return {
                orderId,
                status: "paid",
                message: "Payment already confirmed"
            };
        }

        const result = await OrderRepository.updateStatus(orderId, "paid");

        if (!result || result.affectedRows === 0) {
            throw new AppError("Payment confirmation failed", 500);
        }

        return {
            orderId,
            status: "paid",
            message: "Payment confirmed"
        };
    }

    // 🔹 3. GET ALL USER ORDERS
    async getUserOrders(userId) {
        const rows = await OrderRepository.findFullByUserId(userId);

        if (!rows || rows.length === 0) {
            throw new AppError("No orders found", 404);
        }

        // group by order_id
        const ordersMap = {};

        rows.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = [];
            }
            ordersMap[row.order_id].push(row);
        });

        return Object.values(ordersMap).map(group =>
            orderListDTO(group)
        );
    }

    // ðŸ”¹ 3b. GET ALL ORDERS (ADMIN)
    async getAllOrders() {
        const rows = await OrderRepository.findFullAll();

        if (!rows || rows.length === 0) {
            throw new AppError("No orders found", 404);
        }

        const ordersMap = {};

        rows.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = [];
            }
            ordersMap[row.order_id].push(row);
        });

        return Object.values(ordersMap).map(group =>
            orderDetailDTO(group)
        );
    }

    // 🔹 4. GET SINGLE ORDER (SECURE)
    async getOrderById(role, userId, orderId) {
        const rows = await OrderRepository.findFullById(orderId);

        if (!rows || rows.length === 0) {
            throw new AppError("Order not found", 404);
        }

        if (role != 'admin') {
            if (userId != rows[0].user_id) {
                throw new AppError("Can't Access order", 401);
            }
        }
        return orderDetailDTO(rows);
    }

    // 🔹 5. UPDATE ORDER STATUS
    async updateOrderStatus(orderId, status) {
        const validStatuses = [
            "pending",
            "accepted",
            "paid",
            "shipped",
            "completed",
            "cancelled",
            "refund"
        ];

        if (!validStatuses.includes(status)) {
            throw new AppError("Invalid order status", 400);
        }

        const result = await OrderRepository.updateStatus(orderId, status);

        if (!result || result.affectedRows === 0) {
            throw new AppError("Order not found", 404);
        }

        let rows = await OrderRepository.findFullById(orderId);

        if (status === "completed") {
            const payment = await PaymentsRepository.findByOrderId(orderId);

            if (payment?.payment_method === "cod" && payment.status !== "paid") {
                await PaymentsRepository.updateCheckoutFields(payment.id, {
                    status: "paid",
                    transaction_id: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`
                });
                await createPaymentNotif(orderId, rows[0].user_id);
                rows = await OrderRepository.findFullById(orderId);
            }
        }
        
        await handleCustomerUpdateNotification(orderId, rows[0].user_id, status);
        await handleAdminUpdateNotification(orderId, status);
        return orderDetailDTO(rows);
    }

    // 🔹 6. CANCEL ORDER
    async cancelOrder(userId, orderId) {
        const rows = await OrderRepository.findFullById(orderId);

        if (!rows || rows.length === 0) {
            throw new AppError("Order not found", 404);
        }

        const order = rows[0];

        // ownership check
        if (order.user_id !== userId) {
            throw new AppError("Unauthorized", 403);
        }

        // business rule
        if (["shipped", "completed"].includes(order.status)) {
            throw new AppError("Cannot cancel this order", 400);
        }

        await OrderRepository.updateStatus(orderId, "cancelled");

        const updatedRows = await OrderRepository.findFullById(orderId);

        await handleCustomerUpdateNotification(orderId, userId, 'cancelled');
        return orderListDTO(updatedRows);
    }
}
