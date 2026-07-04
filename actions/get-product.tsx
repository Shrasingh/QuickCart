import { Product } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/products`;


const getProduct = async (id : string) : Promise<Product | null> => {
    try {
        const res = await fetch(`${URL}/${id}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default getProduct