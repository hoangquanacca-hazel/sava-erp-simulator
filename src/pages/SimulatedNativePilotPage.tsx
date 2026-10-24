import React, { useEffect, useState } from 'react';
import type { UIMode } from '../types';

type Pilot = { report_id: string; status: string; missing?: string[]; reason?: string };
type Manifest = {
  package_version: string;
  generated_at: string;
  pilot_count: number;
  ready_pilot_count: number;
  pilot_ids: string[];
  blocked_pilots: Pilot[];
  provenance_class: string;
  native_acceptance: string;
  business_acceptance: string;
  target_release: string;
  eligible_for_demo: boolean;
  eligible_for_production: boolean;
  deployment_status: string;
  files: Array<{ path: string; bytes: number; sha256: string }>;
  checks: Record<string, string>;
};

const BASE = '/sap-reporting/simulated-native/';

export default function SimulatedNativePilotPage({ uiMode = 'fiori' }: { uiMode?: UIMode }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const classic = uiMode === 'classic';

  useEffect(() => {
    fetch(`${BASE}manifest.json`, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Manifest>;
      })
      .then(setManifest)
      .catch(reason => setError(String(reason)));
  }, []);

  return (
    <div className={`min-h-[70vh] px-4 py-6 ${classic ? 'bg-[#f4f1e5] text-[#1d2b3a]' : 'bg-slate-950 text-slate-100'}`}>
      <div className="max-w-7xl mx-auto space-y-5">
        <header className={`rounded-lg border p-5 ${classic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700'}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-400">Phase 3 · integration staging</p>
          <h1 className="text-2xl font-bold mt-2">Simulated Native Pilot</h1>
          <p className="text-sm mt-2 max-w-4xl text-slate-300">Package RAW → CLEAN → CONTROL → MART → ANALYTICS cho kiểm thử adapter Power BI/Simulator. Đây là dữ liệu sinh tổng hợp có provenance rõ, không phải export SAP nguyên bản.</p>
        </header>

        {error && <div className="rounded border border-rose-500 bg-rose-950/40 p-4 text-sm">Không đọc được manifest: {error}</div>}
        {!manifest && !error && <div className="rounded border border-slate-700 p-4 text-sm text-slate-400">Đang đọc manifest package…</div>}
        {manifest && (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              {[
                ['Pilot', `${manifest.ready_pilot_count}/${manifest.pilot_count}`],
                ['Provenance', manifest.provenance_class],
                ['Native', manifest.native_acceptance],
                ['Production', manifest.eligible_for_production ? 'ELIGIBLE' : 'BLOCKED'],
              ].map(([label, value]) => <div key={label} className={`rounded border p-4 ${classic ? 'bg-white border-[#b9c5cc]' : 'bg-slate-900 border-slate-700'}`}><div className="text-[11px] uppercase text-slate-400">{label}</div><div className="mt-1 font-bold text-cyan-300 break-words">{value}</div></div>)}
            </section>

            <section className={`rounded-lg border p-5 ${classic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700'}`}>
              <h2 className="font-bold">Ready for integration testing</h2>
              <div className="overflow-x-auto mt-3"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-700"><th className="p-2">Report</th><th className="p-2">Simulator</th><th className="p-2">Power BI CSV</th><th className="p-2">Control</th></tr></thead><tbody>{manifest.pilot_ids.filter(id => !manifest.blocked_pilots.some(item => item.report_id === id)).map(id => <tr key={id} className="border-b border-slate-800"><td className="p-2 font-semibold">{id}</td><td className="p-2"><a className="text-cyan-300 underline" href={`${BASE}simulator/${id}.simulator.json`} target="_blank" rel="noreferrer">JSON</a></td><td className="p-2"><a className="text-cyan-300 underline" href={`${BASE}power-bi/tables/${id}.csv`} download>CSV</a></td><td className="p-2"><a className="text-cyan-300 underline" href={`${BASE}control/${id}.control.json`} target="_blank" rel="noreferrer">JSON</a></td></tr>)}</tbody></table></div>
            </section>

            {manifest.blocked_pilots.length > 0 && <section className="rounded-lg border border-amber-600 bg-amber-950/30 p-5"><h2 className="font-bold text-amber-200">Blocked — không tự bịa field catalog</h2><ul className="mt-2 list-disc pl-5 text-sm">{manifest.blocked_pilots.map(item => <li key={item.report_id}><b>{item.report_id}</b>: {item.reason}</li>)}</ul></section>}

            <section className={`rounded-lg border p-5 text-sm ${classic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700'}`}>
              <h2 className="font-bold">Acceptance boundary</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1"><li>Business acceptance: <b>{manifest.business_acceptance}</b>; target release: <b>{manifest.target_release}</b>.</li><li>Power BI workspace push và Simulator production push: <b>chưa thực hiện</b>.</li><li>Direct joins: <b>{manifest.checks.direct_joins}</b>; chỉ mở sau native evidence và cardinality approval.</li><li><a className="text-cyan-300 underline" href={`${BASE}manifest.json`} target="_blank" rel="noreferrer">Mở manifest</a> · <a className="text-cyan-300 underline" href={`${BASE}power-bi/dataset.schema.json`} target="_blank" rel="noreferrer">Power BI schema</a></li></ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
