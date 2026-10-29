import { Category } from "@/type";
import { apiGetOne, isRecord } from "@/lib/api";

/**
 * null = the admin says this category does not exist (404) -> the page 404s.
 * Throws CatalogUnavailableError when the admin cannot be reached -> error.tsx.
 */
const getCategory = async (id: string): Promise<Category | null> =>
  apiGetOne<Category>(`/categories/${encodeURIComponent(id)}`, isRecord as (v: unknown) => v is Category);

export default getCategory
