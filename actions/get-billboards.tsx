import { Billboard } from "@/type";
import { apiGet, isArray } from "@/lib/api";

const getBillboards = async (): Promise<Billboard[]> =>
  apiGet<Billboard[]>("/billboards", [], isArray as (v: unknown) => v is Billboard[]);

export default getBillboards
