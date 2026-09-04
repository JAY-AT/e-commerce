// Trace point: getSafe()
export const getSafe = (data, fields = []) => {
  if (!data) return null;

  if (Array.isArray(data)) {
    return data.map(item => getSafe(item, fields));
  }

  if (fields.length == 0) { return data; }
  
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => fields.includes(key))
  );
};
