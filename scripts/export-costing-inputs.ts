/**
 * T2 (S3) — xuất THAM SỐ đầu vào cho oracle giá thành độc lập (scripts/oracle_costing.py).
 * Chỉ xuất dữ liệu cấu hình (preset + bảng phụ phí biến thể), KHÔNG gọi computeMTO, KHÔNG xuất kết quả TS.
 *   tsx scripts/export-costing-inputs.ts          → ghi scripts/costing_inputs.json
 *   tsx scripts/export-costing-inputs.ts --check  → exit 1 nếu file trong repo lệch với mã nguồn
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PRESET_SCENARIOS, VARIANT_COLORS, VARIANT_PACKAGINGS, VARIANT_TEXTURES } from '../src/types.ts';

const file = new URL('./costing_inputs.json', import.meta.url);
const pick = (o: { id: string; resinCostAddonPerKg: number; unitCostAddon: number }) => ({
  id: o.id,
  resinCostAddonPerKg: o.resinCostAddonPerKg,
  unitCostAddon: o.unitCostAddon,
});
const inputs = {
  presets: PRESET_SCENARIOS.map((p) => ({ id: p.id, params: p.params })),
  variants: {
    colors: VARIANT_COLORS.map(pick),
    textures: VARIANT_TEXTURES.map(pick),
    packagings: VARIANT_PACKAGINGS.map(pick),
  },
};
const text = JSON.stringify(inputs, null, 1) + '\n';

if (process.argv.includes('--check')) {
  const onDisk = readFileSync(file, 'utf8');
  if (onDisk !== text) {
    console.error('FAIL costing_inputs.json lệch với src/types.ts — chạy lại: tsx scripts/export-costing-inputs.ts');
    process.exit(1);
  }
  console.log('PASS costing_inputs.json khớp src/types.ts');
} else {
  writeFileSync(file, text);
  console.log(`ghi ${inputs.presets.length} preset + bảng biến thể → scripts/costing_inputs.json`);
}
