import { supabase } from "@/utils/supabase"
import CaseDashboardClient, { type CaseRecord } from "./CaseDashboardClient"

const loadCases = async (): Promise<CaseRecord[]> => {
  const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false })
  if (error || !data) {
    return []
  }
  return data as CaseRecord[]
}

export default async function CaseDashboard() {
  const cases = await loadCases()

  return <CaseDashboardClient cases={cases} />
}
