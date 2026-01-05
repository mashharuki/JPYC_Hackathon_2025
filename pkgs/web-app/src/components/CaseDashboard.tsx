import { supabase } from "@/utils/supabase"
import CaseDashboardClient, { type CaseRecord } from "./CaseDashboardClient"

/**
 * ケース一覧をSupabaseから取得する関数
 * @returns ケース情報の配列
 */
const loadCases = async (): Promise<CaseRecord[]> => {
  const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false })
  if (error || !data) {
    return []
  }
  return data as CaseRecord[]
}

/**
 * CaseDashboardコンポーネント (Server Component):
 * ケース一覧データを取得し、クライアントコンポーネントに渡します。
 */
export default async function CaseDashboard() {
  const cases = await loadCases()

  return <CaseDashboardClient cases={cases} />
}
