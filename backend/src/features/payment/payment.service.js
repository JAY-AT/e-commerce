import OrdersRepository from "../order/order.repository.js";
import PaymentsRepository from "./payment.repository.js";
import AppError from "../../common/utilities/error.js";
import { getFullPaymentDTO } from "../../common/dtos/payment.js";
import { createPaymentNotif } from "../notification/notification.service.js";

export default class PaymentService {

  // Trace point: checkoutPayment()
  static async checkoutPayment(userId, data) {
    const { order_id, payment_method, cash } = data;

    // 1. Validate order exists
    const order = await OrdersRepository.findById(order_id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // 2. Validate ownership
    if (order.user_id !== userId) {
      throw new AppError("Unauthorized access to order", 403);
    }

    // 3. Prevent cancelled / already paid orders
    if (order.status === "cancelled") {
      throw new AppError("Order is cancelled", 400);
    }

    if (order.status === "paid") {
      throw new AppError("Order already paid", 400);
    }

    // 4. Check duplicate payment
    const existingPayment = await PaymentsRepository.findByOrderId(order_id);
    if (existingPayment && existingPayment.status !== "pending") {
      throw new AppError("Payment already exists for this order", 400);
    }

    // 5. Payment validation (cash rule)
    if (payment_method === "cash") {
      if (cash == null) {
        throw new AppError("Cash amount is required for cash payment", 400);
      }

      if (cash < order.total_amount) {
        throw new AppError("Insufficient cash amount", 400);
      }
    }

    const isCod = payment_method === "cod";

    // 6. Generate transaction id only for paid payments.
    const transaction_id = isCod
      ? null
      : `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 7. COD is paid when the customer receives the order.
    const status = isCod ? "pending" : "paid";

    // 8. Create or complete payment
    let paymentId = existingPayment?.id;

    if (existingPayment) {
      await PaymentsRepository.updateCheckoutFields(existingPayment.id, {
        payment_method,
        status,
        transaction_id,
      });
    } else {
      const paymentResult = await PaymentsRepository.create({
        order_id: order.id,
        amount: order.total_amount,
        payment_method,
        status,
        transaction_id
      });

      paymentId = paymentResult.insertId;
    }

    // 9. Update order status
    if (status === "paid" || isCod) {
      await OrdersRepository.updateStatus(order.id, "paid");
    }

    if (status === "paid") {
      await createPaymentNotif(order.id, userId);
    }

    // 10. Fetch full payment details (JOIN)
    const fullPayment = await PaymentsRepository.findFullById(paymentId);

    return getFullPaymentDTO(fullPayment);
  }

  // Trace point: getPaymentById()
  static async getPaymentById(userId, paymentId) {
    // 1. Get full payment (JOIN)
    const payment = await PaymentsRepository.findFullById(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    // 2. Ownership validation via order.user_id
    if (payment.user_id !== userId) {
      throw new AppError("Unauthorized access to payment", 403);
    }

    return getFullPaymentDTO(payment);
  }
}
