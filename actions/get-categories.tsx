import { Category } from "@/type";
import { apiGet } from "@/lib/api";

const getCategories = async (): Promise<Category[]> =>
  apiGet<Category[]>("/categories", []);

export default getCategories
