import { Billboard } from "@/type";
import { apiGet } from "@/lib/api";

const getBillboards = async (): Promise<Billboard[]> =>
  apiGet<Billboard[]>("/billboards", []);

export default getBillboards
