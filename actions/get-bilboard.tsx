import { Billboard } from "@/type";
import { apiGet, isRecord } from "@/lib/api";

// Optional hero billboard: any failure (missing, unavailable, wrong shape)
// yields null and the home page falls back to the store's first billboard.
const getBillboard = async (id: string): Promise<Billboard | null> =>
  apiGet<Billboard | null>(`/billboards/${encodeURIComponent(id)}`, null, isRecord as (v: unknown) => v is Billboard);

export default getBillboard
