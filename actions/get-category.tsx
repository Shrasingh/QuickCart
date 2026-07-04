import { Category } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`;


const getCategory = async (id : string) : Promise<Category | null> => {
    try {
        const res = await fetch(`${URL}/${id}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default getCategory