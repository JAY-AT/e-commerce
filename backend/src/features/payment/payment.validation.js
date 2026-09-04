import {
  optionalNumber,
  requiredOneOf,
  requiredPositiveInteger,
} from "../../common/validation/fields.js";

const paymentMethods = ["cod", "online", "cash", "card", "gcash"];

// Trace point: validatePaymentId()
export const validatePaymentId = (params) => {
  const { value, errors } = requiredPositiveInteger("id", params.id);
  return {
    value: { id: value },
    errors,
  };
};

// Trace point: validateCheckoutPayment()
export const validateCheckoutPayment = (body) => {
  const errors = [];

  const order_id = requiredPositiveInteger("order_id", body.order_id);
  const payment_method = requiredOneOf("payment_method", body.payment_method, paymentMethods);
  const cash = optionalNumber("cash", body.cash, { min: 0 });

  errors.push(...order_id.errors, ...payment_method.errors, ...cash.errors);

  if (payment_method.value === "cash" && cash.value === undefined) {
    errors.push("cash is required for cash payments");
  }

  return {
    value: {
      order_id: order_id.value,
      payment_method: payment_method.value,
      cash: cash.value,
    },
    errors,
  };
};

