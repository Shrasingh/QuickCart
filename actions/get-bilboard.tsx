import { Billboard } from "@/type";
import { apiGet } from "@/lib/api";

const getBillboard = async (id: string): Promise<Billboard | null> =>
  apiGet<Billboard | null>(`/billboards/${encodeURIComponent(id)}`, null);

export default getBillboard
