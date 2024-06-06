import { Category } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`;


console.log("URL -> ", URL)
const getCategories = async () : Promise<Category[]> => {
    // {cache: "no-store"}
    const res = await fetch(URL);
    
    return res.json();
} 

export default getCategories