import {
  requiredOneOf,
  requiredPositiveInteger,
  requiredString,
} from "../../common/validation/fields.js";

const orderStatuses = ["pending", "accepted", "paid", "shipped", "completed", "cancelled", "refund"];

// Trace point: validateOrderId()
export const validateOrderId = (params) => {
  const { value, errors } = requiredPositiveInteger("id", params.id);
  return {
    value: { id: value },
    errors,
  };
};

// Trace point: validateCreateOrder()
export const validateCreateOrder = (body) => {
  const errors = [];
  const shippingAddr = requiredString("shipping_addr", body.shipping_addr, {
    min: 10,
    max: 255,
  });

  errors.push(...shippingAddr.errors);

  return {
    value: {
      shipping_addr: shippingAddr.value,
    },
    errors,
  };
};

// Trace point: validateOrderStatus()
export const validateOrderStatus = (body) => {
  const { value, errors } = requiredOneOf("status", body.status, orderStatuses);
  return {
    value: { status: value },
    errors,
  };
};
