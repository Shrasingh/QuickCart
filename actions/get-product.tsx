import { Product } from "@/type";
import { apiGet } from "@/lib/api";

const getProduct = async (id: string): Promise<Product | null> =>
  apiGet<Product | null>(`/products/${encodeURIComponent(id)}`, null);

export default getProduct
