import { Product } from "@/type";
import { apiGetOne, isRecord } from "@/lib/api";

/**
 * null = the admin says this product does not exist (404) -> the page 404s.
 * Throws CatalogUnavailableError when the admin cannot be reached -> error.tsx.
 */
const getProduct = async (id: string): Promise<Product | null> =>
  apiGetOne<Product>(`/products/${encodeURIComponent(id)}`, isRecord as (v: unknown) => v is Product);

export default getProduct
