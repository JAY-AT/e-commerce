import {
  optionalPositiveInteger,
  requiredPositiveInteger,
} from "../../common/validation/fields.js";

// Trace point: validateCartProductId()
export const validateCartProductId = (params) => {
  const { value, errors } = requiredPositiveInteger("itemId", params.itemId);
  return {
    value: { itemId: value },
    errors,
  };
};

// Trace point: validateAddCartItem()
export const validateAddCartItem = (body) => {
  const errors = [];
  const value = {};

  const productId = requiredPositiveInteger("productId", body.productId);
  const quantity = requiredPositiveInteger("quantity", body.quantity);

  errors.push(...productId.errors, ...quantity.errors);

  value.productId = productId.value;
  value.quantity = quantity.value;

  return { value, errors };
};

export const validateUpdateCartItem = validateAddCartItem;

// Trace point: validateRemoveCartItem()
export const validateRemoveCartItem = (body) => {
  const errors = [];
  const value = {};

  const productId = requiredPositiveInteger("productId", body.productId);
  errors.push(...productId.errors);
  value.productId = productId.value;

  return { value, errors };
};

