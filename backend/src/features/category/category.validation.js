import {
  requiredPositiveInteger,
  requiredString,
} from "../../common/validation/fields.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Trace point: validateCategoryId()
export const validateCategoryId = (params) => {
  const { value, errors } = requiredPositiveInteger("id", params.id);
  return {
    value: { id: value },
    errors,
  };
};

// Trace point: validateCreateCategory()
export const validateCreateCategory = (body) => {
  const errors = [];

  const name = requiredString("name", body.name, { min: 2, max: 100 });
  const slug = requiredString("slug", body.slug, {
    min: 2,
    max: 120,
    pattern: slugPattern,
    message: "slug must contain lowercase letters, numbers, and hyphens only",
  });

  errors.push(...name.errors, ...slug.errors);

  return {
    value: {
      name: name.value,
      slug: slug.value,
    },
    errors,
  };
};

// Trace point: validateUpdateCategory()
export const validateUpdateCategory = (body) => {
  const errors = [];
  const value = {};

  if (Object.keys(body || {}).length === 0) {
    errors.push("At least one category field is required");
    return { value, errors };
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = requiredString("name", body.name, { min: 2, max: 100 });
    errors.push(...name.errors);
    value.name = name.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "slug")) {
    const slug = requiredString("slug", body.slug, {
      min: 2,
      max: 120,
      pattern: slugPattern,
      message: "slug must contain lowercase letters, numbers, and hyphens only",
    });
    errors.push(...slug.errors);
    value.slug = slug.value;
  }

  return { value, errors };
};

