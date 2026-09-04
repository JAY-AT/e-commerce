import {
  emailAddress,
  optionalString,
  requiredString,
} from "../../common/validation/fields.js";

// Trace point: validateRegister()
export const validateRegister = (body) => {
  const errors = [];
  const value = {};

  const email = emailAddress("email", body.email);
  errors.push(...email.errors);
  value.email = email.value;

  const password = requiredString("password", body.password, { min: 8, max: 255 });
  errors.push(...password.errors);
  value.password = password.value;

  const firstName = optionalString("first_name", body.first_name, { min: 2, max: 100 });
  errors.push(...firstName.errors);
  if (firstName.value !== undefined) value.first_name = firstName.value;

  const lastName = optionalString("last_name", body.last_name, { min: 2, max: 100 });
  errors.push(...lastName.errors);
  if (lastName.value !== undefined) value.last_name = lastName.value;

  const phone = optionalString("phone", body.phone, { min: 7, max: 30 });
  errors.push(...phone.errors);
  if (phone.value !== undefined) value.phone = phone.value;

  return { value, errors };
};

// Trace point: validateLogin()
export const validateLogin = (body) => {
  const errors = [];
  const value = {};

  const email = emailAddress("email", body.email);
  errors.push(...email.errors);
  value.email = email.value;

  const password = requiredString("password", body.password, { min: 8, max: 255 });
  errors.push(...password.errors);
  value.password = password.value;

  return { value, errors };
};
