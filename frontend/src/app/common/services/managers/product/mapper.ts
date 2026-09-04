import { ProductDetailDTO, ProductListItemDTO } from "@common/dtos/product.dto";
import { ProductListItem } from "@common/models/product";

// Trace point: toListItem()
export function toListItem(dto: ProductDetailDTO): ProductListItem {
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description ?? null,
    price: dto.price,
    stock: dto.stock,
    category_name: dto.category?.name ?? 'Uncategorized',
    image_url: dto.images?.[0]?.image_url ?? null,
  };
}