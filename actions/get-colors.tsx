import { Color } from "@/type";
import { apiGet } from "@/lib/api";

const getColors = async (): Promise<Color[]> =>
  apiGet<Color[]>("/colors", []);

export default getColors
