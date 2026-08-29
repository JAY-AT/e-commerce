import { Router } from "express";
import OrderController from "./order.controller.js";
import authMiddleware from "../../common/middleware/auth.js";
import { validateRequest } from "../../common/validation/request.js";
import {
    validateCreateOrder,
    validateOrderId,
    validateOrderStatus,
} from "./order.validation.js";
// import adminMiddleware from "../../common/middleware/admin.middleware.js";

const router = Router();

router.get(
    "/public/:id/qrcode",
    validateRequest(validateOrderId, "params"),
    OrderController.getPublicOrderQrCode
);

router.use(authMiddleware);

// GET /api/orders
// get all orders of logged-in user
router.get(
    "/",
    OrderController.getUserOrders
);

router.get(
    "/all",
    OrderController.getAllOrders
);

// GET /api/orders/:id
// get single order details
router.get(
    "/:id/qrcode",
    validateRequest(validateOrderId, "params"),
    OrderController.getOrderQrCode
);

router.post(
    "/:id/confirm-payment",
    validateRequest(validateOrderId, "params"),
    OrderController.confirmPayment
);

router.get(
    "/:id",
    validateRequest(validateOrderId, "params"),
    OrderController.getOrderById
);

// POST /api/orders
// create order (checkout)
router.post(
    "/",
    validateRequest(validateCreateOrder),
    OrderController.createOrder
);

// PUT /api/orders/:id/status
// update order status (admin only)
router.put(
    "/:id/status",
    validateRequest(validateOrderId, "params"),
    validateRequest(validateOrderStatus),
    // adminMiddleware, // enable when you have roles
    OrderController.updateOrderStatus
);

export default router;
