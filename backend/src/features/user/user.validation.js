import {
  emailAddress,
  optionalString,
  requiredOneOf,
  requiredPositiveInteger,
  requiredString,
} from "../../common/validation/fields.js";

const userRoles = ["customer", "admin"];

// Trace point: validateUserId()
export const validateUserId = (params) => {
  const { value, errors } = requiredPositiveInteger("id", params.id);
  return {
    value: { id: value },
    errors,
  };
};

// Trace point: validateUpdateUser()
export const validateUpdateUser = (body) => {
  const errors = [];
  const value = {};

  if (Object.keys(body || {}).length === 0) {
    errors.push("At least one user field is required");
    return { value, errors };
  }

  if (Object.prototype.hasOwnProperty.call(body, "first_name")) {
    const firstName = requiredString("first_name", body.first_name, { min: 2, max: 100 });
    errors.push(...firstName.errors);
    value.first_name = firstName.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "last_name")) {
    const lastName = requiredString("last_name", body.last_name, { min: 2, max: 100 });
    errors.push(...lastName.errors);
    value.last_name = lastName.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const email = emailAddress("email", body.email);
    errors.push(...email.errors);
    value.email = email.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "password")) {
    const password = requiredString("password", body.password, { min: 8, max: 255 });
    errors.push(...password.errors);
    value.password = password.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    const role = requiredOneOf("role", body.role, userRoles);
    errors.push(...role.errors);
    value.role = role.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const phone = optionalString("phone", body.phone, { min: 7, max: 30 });
    errors.push(...phone.errors);
    if (phone.value !== undefined) value.phone = phone.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "address_line")) {
    const addressLine = optionalString("address_line", body.address_line, { min: 3, max: 255 });
    errors.push(...addressLine.errors);
    if (addressLine.value !== undefined) value.address_line = addressLine.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "city")) {
    const city = optionalString("city", body.city, { min: 2, max: 100 });
    errors.push(...city.errors);
    if (city.value !== undefined) value.city = city.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "state")) {
    const state = optionalString("state", body.state, { min: 2, max: 100 });
    errors.push(...state.errors);
    if (state.value !== undefined) value.state = state.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "postal_code")) {
    const postalCode = optionalString("postal_code", body.postal_code, { min: 3, max: 20 });
    errors.push(...postalCode.errors);
    if (postalCode.value !== undefined) value.postal_code = postalCode.value;
  }

  return { value, errors };
};
