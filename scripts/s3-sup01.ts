/**
 * S3 SUP01 — bảng đối chiếu tổng hợp: mọi dòng OK trên 54 ca; FI_VAL khớp oracle;
 * âm tính 2 lớp: (a) sửa ô REPORT_VAL → DIFF không còn nhất quán; (b) sửa 1 số ở MỖI báo cáo đầu vào → SUP01 báo LECH.
 */
import { buildCk13n } from '../src/reports/ck13n.ts';
import {
  buildCooisComponents, buildCooisConfirmations, buildCooisGoodsMovements, buildCooisHeader, buildCooisOperations,
} from '../src/reports/coois.ts';
import { buildKks1 } from '../src/reports/kks1.ts';
import { buildKob1 } from '../src/reports/kob1.ts';
import { buildMb51 } from '../src/reports/mb51.ts';
import { buildSup01, sup01Breaks, type Sup01Input } from '../src/reports/sup01.ts';
import { bal154, buildCase, type Case, fiCr, fiDr, idx, loadExpected, on, runSuites, tamper } from './s3-lib.ts';

function inputs(c: Case): Sup01Input {
  return {
    mb51: buildMb51(c.ev),
    header: buildCooisHeader(c.ev, c.computed.plannedCost),
    components: buildCooisComponents(c.ev),
    operations: buildCooisOperations(c.ev),
    confirmations: buildCooisConfirmations(c.ev),
    goodsMovements: buildCooisGoodsMovements(c.ev),
    kob1: buildKob1(c.table),
    kks1: buildKks1(c.ev, c.computed, c.table),
    ck13n: buildCk13n(c.params, c.computed),
  };
}
const TAMPER: Record<keyof Sup01Input, string> = {
  mb51: 'DMBTR', header: 'ACT_COST', components: 'ACT_VAL', operations: 'ACT_COST', confirmations: 'LAB_VAL',
  goodsMovements: 'DMBTR', kob1: 'WKGBTR', kks1: 'WIP', ck13n: 'WERT',
};

async function main() {
  await runSuites('S3', [{
    id: 'SUP01',
    build: (c) => buildSup01(inputs(c), c.table),
    sourceCount: (c) => (c.e.stock === 'Valuated' ? 18 : 16),
    tamperField: 'REPORT_VAL',
    reconcile: (r, c) => {
      const is = sup01Breaks(r);
      for (const row of r.rows) {
        const rv = Number(row[idx(r, 'REPORT_VAL')]), fv = Number(row[idx(r, 'FI_VAL')]), d = Number(row[idx(r, 'DIFF')]);
        if (d !== rv - fv) is.push(`dòng ${row[0]}: DIFF ${d} ≠ ${rv} − ${fv}`);
        if (row[idx(r, 'STATUS')] !== (d === 0 ? 'OK' : 'LECH')) is.push(`dòng ${row[0]}: STATUS ${row[idx(r, 'STATUS')]} không khớp DIFF ${d}`);
        const rule = row[idx(r, 'FI_RULE')];
        // FI_VAL của SUP01 phải khớp tính độc lập + oracle
        const want: Record<string, number> = {
          'Có 152 (MIGO 261E)': c.e.cr152,
          'Nợ 622 (CO11N)': c.e.cr334,
          'Nợ 627 (CO11N)': c.e.cr214,
          'Số dư Nợ 154': c.e.wip154_dr_minus_cr,
          'Nợ 154 (CO01)': c.e.actual,
          'Nợ 155 (MIGO 101E)': fiDr(c.table, on('155', /101E/)),
          'Có 155 (MIGO 601E)': fiCr(c.table, on('155', /601E/)),
        };
        if (rule in want && fv !== want[rule]) is.push(`dòng ${row[0]} ${rule}: FI_VAL ${fv} ≠ ${want[rule]}`);
        if (rule.endsWith('(không có FI)') && fv !== c.e.P) is.push(`dòng ${row[0]} ${rule}: ${fv} ≠ oracle P ${c.e.P}`);
        if (rule === 'Số dư Nợ 154' && fv !== bal154(c.table)) is.push(`dòng ${row[0]}: số dư 154 sai`);
      }
      return is;
    },
  }]);

  // (b) âm tính theo từng báo cáo đầu vào
  let caught = 0;
  const fails: string[] = [];
  for (const e of loadExpected()) {
    const c = buildCase(e);
    const base = inputs(c);
    for (const k of Object.keys(TAMPER) as (keyof Sup01Input)[]) {
      const bad = { ...base, [k]: tamper(base[k], TAMPER[k]) };
      const rep = buildSup01(bad, c.table);
      if (sup01Breaks(rep).length === 0 || !rep.rows.some((row) => row[idx(rep, 'STATUS')] === 'LECH')) fails.push(`${c.label}: sửa ${k}.${TAMPER[k]} không bị SUP01 phát hiện`);
      else caught++;
    }
  }
  if (fails.length) {
    console.error(`FAIL SUP01 âm tính ${fails.length}:\n` + fails.slice(0, 30).join('\n'));
    process.exit(1);
  }
  console.log(`PASS S3 SUP01 âm tính đầu vào: ${caught}/${54 * 9} lần sửa 1 số ở 9 báo cáo nguồn đều bị báo LECH`);
}
main().catch((e) => { console.error(e); process.exit(1); });
