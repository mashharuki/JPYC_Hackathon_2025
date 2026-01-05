import CaseDashboard from "@/components/CaseDashboard"
import HomeClient from "@/components/HomeClient"

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-950/70 via-slate-900/30 to-blue-900/10 p-6 shadow-[0_20px_60px_rgba(24,20,16,0.18)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Innocence Ledger</p>
        <h2 className="mt-3 text-4xl text-slate-100">
          支援の透明性と匿名性を、
          <br />
          同時に。
        </h2>
        <p className="mt-4 text-sm text-slate-300">
          冤罪被害者支援のためのオンチェーン支援インフラ。ケースの進捗を確認し、匿名で寄付・引き出しを行えます。
        </p>
      </section>

      <CaseDashboard />
      <HomeClient />
    </div>
  )
}
