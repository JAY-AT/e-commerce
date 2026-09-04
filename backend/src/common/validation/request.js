import AppError from "../utilities/error.js";

// Trace point: validateRequest()
export const validateRequest = (schema, source = "body") => (req, res, next) => {
  const result = schema(req[source] ?? {});

  if (result.errors.length > 0) {
    return next(new AppError("Validation failed", 422, result.errors));
  }

  req[source] = result.value;
  return next();
};

