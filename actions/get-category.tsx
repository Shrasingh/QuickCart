import { Category } from "@/type";
import { apiGet } from "@/lib/api";

const getCategory = async (id: string): Promise<Category | null> =>
  apiGet<Category | null>(`/categories/${encodeURIComponent(id)}`, null);

export default getCategory
