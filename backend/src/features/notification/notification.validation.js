import {
  requiredPositiveInteger,
  requiredString,
  requiredOneOf,
} from "../../common/validation/fields.js";

const notificationTypes = ["order", "payment", "system"];

// Trace point: validateNotificationId()
export const validateNotificationId = (params) => {
  const { value, errors } = requiredPositiveInteger("id", params.id);
  return {
    value: { id: value },
    errors,
  };
};

// Trace point: validateUserIdParam()
export const validateUserIdParam = (params) => {
  const { value, errors } = requiredPositiveInteger("userId", params.userId);
  return {
    value: { userId: value },
    errors,
  };
};

// Trace point: validateCreateNotification()
export const validateCreateNotification = (body) => {
  const errors = [];
  const value = {};

  // ✅ Validate target_role FIRST
  const allowedRoles = ["admin", "customer"];
  const target_role = requiredOneOf("target_role", body.target_role, allowedRoles);
  errors.push(...target_role.errors);
  value.target_role = target_role.value;

  // ✅ Conditional user_id
  if (target_role.value === "customer") {
    const user_id = requiredPositiveInteger("user_id", body.user_id);
    errors.push(...user_id.errors);
    value.user_id = user_id.value;
  } else {
    // admin → explicitly set null (optional but clean)
    value.user_id = null;
  }

  // ✅ Type
  const type = requiredOneOf("type", body.type, notificationTypes);
  errors.push(...type.errors);
  value.type = type.value;

  // ✅ Message
  const message = requiredString("message", body.message, { min: 3, max: 500 });
  errors.push(...message.errors);
  value.message = message.value;

  return { value, errors };
};