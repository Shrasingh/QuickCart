import { Size } from "@/type";
import { apiGet, isArray } from "@/lib/api";

const getSizes = async (): Promise<Size[]> =>
  apiGet<Size[]>("/sizes", [], isArray as (v: unknown) => v is Size[]);

export default getSizes
