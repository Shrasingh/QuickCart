import { Color } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/colors`;

const getColors = async () : Promise<Color[]> => {
    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default getColors 