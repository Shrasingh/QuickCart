import { Size } from "@/type";
import { apiGet } from "@/lib/api";

const getSizes = async (): Promise<Size[]> =>
  apiGet<Size[]>("/sizes", []);

export default getSizes
