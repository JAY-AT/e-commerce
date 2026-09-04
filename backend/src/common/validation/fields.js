// Trace point: cleanString()
const cleanString = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

// Trace point: requiredString()
export const requiredString = (field, value, options = {}) => {
  const {
    min = 1,
    max = Number.POSITIVE_INFINITY,
    pattern,
    message,
  } = options;

  const errors = [];

  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
    return { value: '', errors };
  }

  const nextValue = cleanString(value);

  if (nextValue.length < min) {
    errors.push(message || `${field} must be at least ${min} characters long`);
  }

  if (nextValue.length > max) {
    errors.push(`${field} must be at most ${max} characters long`);
  }

  if (pattern && !pattern.test(nextValue)) {
    errors.push(message || `${field} has an invalid format`);
  }

  return { value: nextValue, errors };
};

// Trace point: optionalString()
export const optionalString = (field, value, options = {}) => {
  const {
    min = 0,
    max = Number.POSITIVE_INFINITY,
    pattern,
  } = options;

  const errors = [];

  if (value === undefined || value === null || value === '') {
    return { value: undefined, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
    return { value: undefined, errors };
  }

  const nextValue = cleanString(value);

  if (nextValue.length < min) {
    errors.push(`${field} must be at least ${min} characters long`);
  }

  if (nextValue.length > max) {
    errors.push(`${field} must be at most ${max} characters long`);
  }

  if (pattern && !pattern.test(nextValue)) {
    errors.push(`${field} has an invalid format`);
  }

  return { value: nextValue, errors };
};

// Trace point: requiredNumber()
export const requiredNumber = (field, value, options = {}) => {
  const {
    integer = false,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
  } = options;

  const errors = [];
  const nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    errors.push(`${field} must be a number`);
    return { value: 0, errors };
  }

  if (integer && !Number.isInteger(nextValue)) {
    errors.push(`${field} must be an integer`);
  }

  if (nextValue < min) {
    errors.push(`${field} must be greater than or equal to ${min}`);
  }

  if (nextValue > max) {
    errors.push(`${field} must be less than or equal to ${max}`);
  }

  return { value: nextValue, errors };
};

// Trace point: optionalNumber()
export const optionalNumber = (field, value, options = {}) => {
  const {
    integer = false,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
  } = options;

  const errors = [];

  if (value === undefined || value === null || value === '') {
    return { value: undefined, errors };
  }

  const nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    errors.push(`${field} must be a number`);
    return { value: undefined, errors };
  }

  if (integer && !Number.isInteger(nextValue)) {
    errors.push(`${field} must be an integer`);
  }

  if (nextValue < min) {
    errors.push(`${field} must be greater than or equal to ${min}`);
  }

  if (nextValue > max) {
    errors.push(`${field} must be less than or equal to ${max}`);
  }

  return { value: nextValue, errors };
};

// Trace point: requiredRating()
export const requiredRating = (field, value) => {
  const num = Number(value);

  const errors = [];

  if (!num || num < 1 || num > 5) {
    errors.push(`${field} must be between 1 and 5`);
  }

  return {
    value: num,
    errors
  };
};

// Trace point: requiredPositiveInteger()
export const requiredPositiveInteger = (field, value) =>
  requiredNumber(field, value, { integer: true, min: 1 });

// Trace point: optionalPositiveInteger()
export const optionalPositiveInteger = (field, value) =>
  optionalNumber(field, value, { integer: true, min: 1 });

// Trace point: requiredOneOf()
export const requiredOneOf = (field, value, allowed) => {
  const errors = [];

  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
    return { value: '', errors };
  }

  const nextValue = cleanString(value);

  if (!allowed.includes(nextValue)) {
    errors.push(`${field} must be one of: ${allowed.join(', ')}`);
  }

  return { value: nextValue, errors };
};

// Trace point: emailAddress()
export const emailAddress = (field, value) => {
  const { value: nextValue, errors } = requiredString(field, value, {
    min: 5,
    max: 255,
  });

  if (errors.length === 0) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(nextValue)) {
      errors.push(`${field} must be a valid email address`);
    }
  }

  return { value: nextValue, errors };
};

