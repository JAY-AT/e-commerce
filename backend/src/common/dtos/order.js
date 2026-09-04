// 🔹 LIST VIEW (for grouped rows)
export const orderListDTO = (rows) => {
  const first = rows[0];

  return {
    id: first.order_id,
    user_id: first.user_id,
    total_amount: first.total_amount,
    status: first.status,
    payment_method: first.payment_method ?? null,
    payment_status: first.payment_status ?? null,
    created_at: first.created_at
  };
};

// Trace point: orderReviewDTO()
export const orderReviewDTO = (row) => {
  if (!row || !row.review_id) return null;

  return {
    id: row.review_id,
    rating: row.review_rating,
    comment: row.review_comment,
    created_at: row.review_created_at
  };
};

// 🔹 DETAIL VIEW
export const orderDetailDTO = (rows) => {
  const first = rows[0];

  const items = rows
    .filter(item => item.order_item_id)
    .map(item => orderItemFullDTO(item));

  // 🔥 delegate review mapping to review DTO
  const review = orderReviewDTO(first);

  return {
    id: first.order_id,
    user_id: first.user_id,
    total_amount: first.total_amount,
    status: first.status,
    payment_method: first.payment_method ?? null,
    payment_status: first.payment_status ?? null,
    shipping_addr: first.shipping_addr,
    items,
    review, // clean injection
    created_at: first.created_at
  };
};


// 🔹 ORDER ITEM
export const orderItemFullDTO = (item) => {
  const price = item.product_price ?? item.price; // fallback safety
  const subtotal = price * item.quantity;

  return {
    id: item.order_item_id,
    product: {
      id: item.product_id,
      name: item.name,
      price
    },
    quantity: item.quantity,
    subtotal
  };
};
