import {
  emailAddress,
  optionalNumber,
  optionalString,
  requiredNumber,
  requiredPositiveInteger,
  requiredString,
} from "../../common/validation/fields.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Trace point: validateProductId()
export const validateProductId = (params) => {
  const { value, errors } = requiredPositiveInteger("id", params.id);
  return {
    value: { id: value },
    errors,
  };
};

// Trace point: validateCreateProduct()
export const validateCreateProduct = (body) => {
  const errors = [];

  const name = requiredString("name", body.name, { min: 3, max: 255 });
  const description = requiredString("description", body.description, {
    min: 10,
    max: 5000,
  });
  const image_url = optionalString("image_url", body.image_url, {
    max: 1000,
  });
  const price = requiredNumber("price", body.price, { min: 0 });
  const stock = requiredNumber("stock", body.stock, { integer: true, min: 0 });
  const category_id = requiredPositiveInteger("category_id", body.category_id);

  errors.push(...name.errors, ...description.errors, ...image_url.errors, ...price.errors, ...stock.errors, ...category_id.errors);

  return {
    value: {
      name: name.value,
      description: description.value,
      image_url: image_url.value,
      price: price.value,
      stock: stock.value,
      category_id: category_id.value,
    },
    errors,
  };
};

// Trace point: validateUpdateProduct()
export const validateUpdateProduct = (body) => {
  const errors = [];
  const value = {};
  const fields = Object.keys(body || {});

  if (fields.length === 0) {
    errors.push("At least one product field is required");
    return { value, errors };
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = requiredString("name", body.name, { min: 3, max: 255 });
    errors.push(...name.errors);
    value.name = name.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = requiredString("description", body.description, {
      min: 10,
      max: 5000,
    });
    errors.push(...description.errors);
    value.description = description.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "price")) {
    const price = requiredNumber("price", body.price, { min: 0 });
    errors.push(...price.errors);
    value.price = price.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "stock")) {
    const stock = requiredNumber("stock", body.stock, { integer: true, min: 0 });
    errors.push(...stock.errors);
    value.stock = stock.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, "category_id")) {
    const category_id = requiredPositiveInteger("category_id", body.category_id);
    errors.push(...category_id.errors);
    value.category_id = category_id.value;
  }

  return { value, errors };
};
