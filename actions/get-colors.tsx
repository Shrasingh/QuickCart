import { Color } from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/colors`;


console.log("URL -> ", URL)
const getColors = async () : Promise<Color[]> => {
    // {cache: "no-store"}
    const res = await fetch(URL);
    
    return res.json();
} 

export default getColors 