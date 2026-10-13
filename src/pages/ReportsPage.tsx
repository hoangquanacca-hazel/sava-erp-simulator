import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import { AcdocaLine, MTOComputed, MTOParameters, UIMode } from '../types';
import { buildAllReports } from '../reports/registry';
import { buildManifest, toRawExport, type RawManifest } from '../reports/core';

const PREVIEW_ROWS = 200;

function download(fileName: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** T2/S2 — 11 báo cáo định dạng SAP (MÔ PHỎNG) từ ACDOCA + sự kiện logistics hiện tại. Đối soát tự động: npm run test:s3 (CI). */
export const ReportsPage: React.FC<{
  params: MTOParameters;
  computed: MTOComputed;
  acdoca: AcdocaLine[];
  uiMode?: UIMode;
}> = ({ params, computed, acdoca, uiMode = 'fiori' }) => {
  const classic = uiMode === 'classic';
  const built = useMemo(() => {
    if (acdoca.length === 0) return { reports: [], error: '' };
    try {
      return { reports: buildAllReports(params, computed, acdoca), error: '' };
    } catch (e) {
      return { reports: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [params, computed, acdoca]);
  const [selected, setSelected] = useState('FAGLL03');
  const report = built.reports.find((r) => r.reportId === selected) ?? built.reports[0];
  const raw = useMemo(() => (report ? toRawExport(report) : null), [report]);
  const [manifest, setManifest] = useState<RawManifest | null>(null);

  useEffect(() => {
    let alive = true;
    setManifest(null);
    if (report && raw) buildManifest(report, raw, acdoca.length, {}).then((m) => alive && setManifest(m));
    return () => {
      alive = false;
    };
  }, [report, raw, acdoca.length]);

  const head = classic ? 'text-[#0a246a]' : 'text-white';
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${head}`}>
          <FileText className="w-5 h-5" /> Báo cáo SAP (SIMULATED · TT99)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          FAGLL03, MB51, COOIS (5 danh sách), KOB1, KKS1, CK13N, SUP01 — sinh tất định từ các chứng từ đã hạch toán trên
          Cockpit. Đối soát Σ báo cáo = Σ ACDOCA chạy tự động trên 54 ca (test:s3).
        </p>
      </div>

      {acdoca.length === 0 ? (
        <div className="rounded-lg border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-200">
          Chưa có chứng từ nào. Chạy các bước trên Cockpit 7 bước trước khi xem báo cáo.
        </div>
      ) : built.error ? (
        <div className="rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm text-red-200">
          Không dựng được báo cáo: {built.error}
        </div>
      ) : report && raw ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {built.reports.map((r) => (
              <button
                key={r.reportId}
                type="button"
                onClick={() => setSelected(r.reportId)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                  r.reportId === report.reportId
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-700'
                }`}
              >
                {r.reportId} <span className="opacity-60">({r.rows.length})</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-slate-100">{report.title}</div>
            <div className="flex items-center gap-2 font-mono break-all">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              SHA-256: {manifest ? manifest.sha256 : 'đang tính…'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => download(raw.fileName, raw.bytes, 'text/tab-separated-values;charset=utf-8')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 hover:border-cyan-600 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> {raw.fileName}
              </button>
              <button
                type="button"
                disabled={!manifest}
                onClick={() =>
                  manifest &&
                  download(raw.fileName.replace(/\.txt$/, '.manifest.json'), JSON.stringify(manifest, null, 2), 'application/json')
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 hover:border-cyan-600 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> manifest.json
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-800 max-h-[60vh]">
            <table className="min-w-full text-[11px] font-mono">
              <thead className="bg-slate-900 sticky top-0">
                <tr>
                  {report.columns.map((c) => (
                    <th key={c.field} title={c.label} className="px-2 py-1.5 text-left text-slate-400 whitespace-nowrap">
                      {c.field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                  <tr key={i} className="border-t border-slate-800 text-slate-200">
                    {row.map((v, j) => (
                      <td key={j} className="px-2 py-1 whitespace-nowrap">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
                {report.rows.length === 0 && (
                  <tr>
                    <td colSpan={report.columns.length} className="px-2 py-3 text-slate-500">
                      Không có dòng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {report.rows.length > PREVIEW_ROWS && (
            <p className="text-[11px] text-slate-500">
              Hiển thị {PREVIEW_ROWS}/{report.rows.length} dòng — tải file để xem đủ.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ReportsPage;
