import qs from "query-string"

import { Product } from "@/type";
import { apiGet } from "@/lib/api";

export interface ProductQuery {
    categoryId?: string;
    colorId?: string;
    sizeId?: string;
    isFeatured?: boolean;
    search?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
}

// Unset filters are omitted from the query string (query-string skips
// `undefined`), so the admin API only sees the filters the user chose.
const getProducts = async (query: ProductQuery): Promise<Product[]> => {
    const path = qs.stringifyUrl({
        url: "/products",
        query: {
            colorId: query.colorId,
            sizeId: query.sizeId,
            categoryId: query.categoryId,
            isFeatured: query.isFeatured,
            search: query.search,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
        },
    })
    return apiGet<Product[]>(path, [])
}

export default getProducts
