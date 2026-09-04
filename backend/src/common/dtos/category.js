// Trace point: categoryDTO()
export const categoryDTO = (category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  created_at: category.created_at
});