import { Category } from "@/type";
import { apiGet, isArray } from "@/lib/api";

const getCategories = async (): Promise<Category[]> =>
  apiGet<Category[]>("/categories", [], isArray as (v: unknown) => v is Category[]);

export default getCategories
