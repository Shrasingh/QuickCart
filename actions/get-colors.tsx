import { Color } from "@/type";
import { apiGet, isArray } from "@/lib/api";

const getColors = async (): Promise<Color[]> =>
  apiGet<Color[]>("/colors", [], isArray as (v: unknown) => v is Color[]);

export default getColors
