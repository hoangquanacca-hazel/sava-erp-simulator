/** S1: kiểm tra cấu hình cố định + ánh xạ tài khoản. Không có nhánh giả lập; sai là throw. */
import { SIM_CONFIG, ACCOUNT_MAP, accountEntry } from '../src/config/simConfig.ts';
import { accountNameOf } from '../src/utils/acdoca.ts';
import { PRESET_SCENARIOS } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';

const codes = ACCOUNT_MAP.map((a) => a.code);
if (new Set(codes).size !== codes.length) throw new Error('ACCOUNT_MAP trùng mã');

for (const a of ACCOUNT_MAP) {
  if (accountNameOf(a.code).startsWith('Tài khoản ')) throw new Error(`ACDOCA thiếu tên cho ${a.code}`);
}

const used = new Set<string>();
for (const p of PRESET_SCENARIOS) {
  const computed = computeMTO(p.params);
  for (let step = 1; step <= 7; step++) {
    const posted = generateStepEntries(step, p.params, computed, 0, 0, null);
    for (const line of posted.acdoca) used.add(line.glAccount);
  }
}
const missing = [...used].filter((c) => !accountEntry(c));
if (missing.length) throw new Error(`TK được post nhưng chưa có trong ACCOUNT_MAP: ${missing.join(', ')}`);
if (used.size === 0) throw new Error('Không có dòng ACDOCA nào được post — test vô nghĩa');

console.log(
  `PASS S1 config ${SIM_CONFIG.companyCode}/${SIM_CONFIG.plant}/${SIM_CONFIG.accountingStandard}; map=${codes.length}; used(7 bước)=${used.size}: ${[...used].sort().join(',')}`
);
