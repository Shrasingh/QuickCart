import { Billboard } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/billboards`;


const getBillboard = async (id : string) : Promise<Billboard | null> => {
    try {
        const res = await fetch(`${URL}/${id}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default getBillboard