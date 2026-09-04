// Trace point: paymentDTO()
export const paymentDTO = (payment) => ({
  id: payment.id,
  order_id: payment.order_id,
  amount: payment.amount,
  payment_method: payment.payment_method,
  status: payment.status,
  transaction_id: payment.transaction_id,
  created_at: payment.created_at
});

// Trace point: getFullPaymentDTO()
export const getFullPaymentDTO = (data) => {
  if (!data) return null;

  return {
    payment: {
      id: data.payment_id,
      order_id: data.order_id,
      amount: data.amount,
      payment_method: data.payment_method,
      status: data.payment_status,
      transaction_id: data.transaction_id,
      created_at: data.payment_created_at
    },

    order: {
      id: data.order_id,
      user_id: data.user_id,
      total_amount: data.total_amount,
      status: data.order_status,
      shipping_addr: data.shipping_addr,
      created_at: data.order_created_at
    }
  };
};
