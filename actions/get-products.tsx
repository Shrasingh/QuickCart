import qs from "query-string"

import { Product } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/products`;

interface Query {
    categoryId? : string;
    colorId?: string ;
    sizeId? : string;
    isFeatured? : boolean
    search? : string;
    minPrice? : string | number;
    maxPrice? : string | number;
}

const getProducts = async (query : Query) : Promise<Product[]> => {
    const url = qs.stringifyUrl({
        url : URL,
        query : {
            colorId : query.colorId,
            sizeId : query.sizeId,
            categoryId : query.categoryId,
            isFeatured : query.isFeatured,
            search : query.search,
            minPrice : query.minPrice,
            maxPrice : query.maxPrice,
        },
    })
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default getProducts