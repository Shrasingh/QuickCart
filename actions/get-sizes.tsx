import { Size} from "@/type";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/sizes`;


console.log("URL -> ", URL)
const getSizes= async () : Promise<Size[]> => {
    // {cache: "no-store"}
    const res = await fetch(URL);
    
    return res.json();
} 

export default getSizes