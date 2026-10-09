"""Oracle độc lập GIÁ THÀNH KẾ HOẠCH (CK11N/CK51N) — S3/T2. KHÔNG gọi mã TypeScript, KHÔNG đọc kết quả TS.

Đầu vào duy nhất: scripts/costing_inputs.json (THAM SỐ preset + bảng phụ phí biến thể, do
scripts/export-costing-inputs.ts xuất thẳng từ src/types.ts).

Chính sách giá thành (đã chốt):
  M (621)  = Σ dòng BOM: SL_gộp = SL_đơn/1000 × định mức × (1 + hao hụt%), tiền = làm tròn(SL_gộp × đơn giá)
             - ROH nhựa nền: định mức kg/1000, hao hụt 2,5%, đơn giá = giá nhựa/kg + màu/kg + texture/kg (Strategy 25)
             - ROH-MB-COLOR (nếu màu > 0): định mức = 2% định mức nhựa (2 chữ số), hao hụt 1%, đơn giá = màu/kg × 50
             - VERP bao bì (nếu bao bì > 0): 1000 cái/1000, hao hụt 1%, đơn giá = phụ phí bao bì/cái
  L (622)  = theo giờ: làm tròn(giờ vận hành × đơn giá nhân công/h); theo tổng: làm tròn(laborTotal)
             giờ vận hành = 2 chữ số(chu kỳ(s) × SL / 3600 + 1,5 h setup); chu kỳ = max(10, làm tròn(giờ máy × 3600 / SL))
  O (627)  = máy + SXC + add-on biến thể
             máy = theo giờ: làm tròn(giờ vận hành × đơn giá máy/h); theo tổng: làm tròn(machineTotal)
             SXC = làm tròn((M + L) × 8%)
             add-on = làm tròn(SL × texture/cái)        ← Q1 = (a) 09/10/2026: bao bì CHỈ nằm trong BOM (VERP → 621/152),
                                                          KHÔNG cộng lại vào add-on. (Chính sách cũ: + bao bì/cái.)
  P = M + L + O ; Rev = làm tròn(SL × giá bán)
Phụ phí biến thể chỉ áp dụng cho Strategy 25.
Làm tròn mô phỏng JS: Math.round = floor(x + 0.5); Number.toFixed(2) = làm tròn nửa lên trên giá trị nhị phân chính xác.

  python3 scripts/oracle_costing.py          → ghi scripts/costing_expected.json
  python3 scripts/oracle_costing.py --check  → exit 1 nếu file trong repo khác kết quả oracle (chống sửa tay đáp án)
"""
import json, math, os, sys
from decimal import Decimal, ROUND_HALF_UP

HERE = os.path.dirname(os.path.abspath(__file__))
SXC_RATE = 8.0
SETUP_H = 1.5
DEFAULT_LABOR_RATE, DEFAULT_MACHINE_RATE = 75000, 145000


def jsr(x):
    return math.floor(x + 0.5)


def fixed2(x):
    return float(Decimal(x).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def find(table, vid):
    return next((v for v in table if v['id'] == vid), None)


def cost(p, variants):
    q = p.get('orderQuantity') or 0
    norm = p.get('materialNormKgPer1000') or 0
    color_kg = tex_kg = tex_unit = pack_unit = 0
    if p.get('strategy') == 'Strategy 25':
        c = find(variants['colors'], p.get('variantColorId'))
        t = find(variants['textures'], p.get('variantTextureId'))
        k = find(variants['packagings'], p.get('variantPackagingId'))
        if c: color_kg = c['resinCostAddonPerKg']
        if t: tex_kg, tex_unit = t['resinCostAddonPerKg'], t['unitCostAddon']
        if k: pack_unit = k['unitCostAddon']
    assert not p.get('bomItems') and not p.get('routing'), 'oracle chỉ hỗ trợ BOM/routing mặc định'

    bom = [('ROH-RESIN', norm, 2.5, (p.get('resinPricePerKg') or 0) + color_kg + tex_kg)]
    if color_kg > 0:
        bom.append(('ROH-MB-COLOR', fixed2(norm * 0.02), 1.0, color_kg * 50))
    if pack_unit > 0:
        bom.append(('VERP-PACKAGING', 1000, 1.0, pack_unit))
    lines = {code: jsr((q / 1000) * per1000 * (1 + scrap / 100) * price) for code, per1000, scrap, price in bom}
    M = sum(lines.values())

    mh = p.get('machineHours') or 0
    cycle = max(10, jsr((mh * 3600) / q)) if q > 0 and mh > 0 else 26
    op_h = fixed2((cycle * q) / 3600 + SETUP_H)
    L = jsr(op_h * (p.get('laborRatePerHour') or DEFAULT_LABOR_RATE)) if p.get('laborCostMode') == 'hourly' \
        else jsr(p.get('laborTotal') or 0)
    machine = jsr(op_h * (p.get('machineRatePerHour') or DEFAULT_MACHINE_RATE)) if p.get('machineCostMode') == 'hourly' \
        else jsr(p.get('machineTotal') or 0)
    sxc = jsr((M + L) * (SXC_RATE / 100))
    addon = jsr(q * tex_unit)  # Q1 = (a): không cộng pack_unit
    O = machine + sxc + addon
    return dict(M=M, L=L, O=O, P=M + L + O, Rev=jsr(q * (p.get('sellingPrice') or 0)),
                machine=machine, sxc=sxc, addon=addon, bom=lines)


def build_cases():
    inp = json.load(open(os.path.join(HERE, 'costing_inputs.json'), encoding='utf-8'))
    v = inp['variants']
    cases = []
    for pr in inp['presets']:
        cases.append(dict(id=pr['id'], src=pr['id'], override={}, **cost(pr['params'], v)))
    denso = next(pr for pr in inp['presets'] if pr['id'] == 'denso-sensor')
    for c in v['colors']:
        for t in v['textures']:
            for k in v['packagings']:
                ov = dict(variantColorId=c['id'], variantTextureId=t['id'], variantPackagingId=k['id'])
                cases.append(dict(id=f"denso/{c['id']}/{t['id']}/{k['id']}", src='denso-sensor', override=ov,
                                  **cost({**denso['params'], **ov}, v)))
    # Strategy 20 phải bỏ qua mọi phụ phí biến thể dù có gắn mã biến thể
    sam = next(pr for pr in inp['presets'] if pr['id'] == 'samsung-cover')
    ov = dict(variantColorId='c-ylw', variantTextureId='t-esd', variantPackagingId='p-ip68')
    cases.append(dict(id='samsung/S20+variant-ids', src='samsung-cover', override=ov, **cost({**sam['params'], **ov}, v)))
    return cases


def planned_by_preset():
    """M/L/O/Rev/P theo preset — đầu vào cho a0_oracle.py (thay /tmp/planned.json)."""
    return {c['src']: {k: c[k] for k in ('M', 'L', 'O', 'Rev', 'P')} for c in build_cases() if c['id'] == c['src']}


if __name__ == '__main__':
    cases = build_cases()
    text = json.dumps(cases, ensure_ascii=False, indent=1) + '\n'
    out = os.path.join(HERE, 'costing_expected.json')
    if '--check' in sys.argv:
        if open(out, encoding='utf-8').read() != text:
            print('FAIL costing_expected.json khác kết quả oracle — không sửa tay đáp án; chạy lại oracle')
            sys.exit(1)
        print(f'PASS costing_expected.json = oracle ({len(cases)} ca)')
    else:
        open(out, 'w', encoding='utf-8').write(text)
        print(len(cases), 'ca')
        for c in cases:
            if c['id'] == c['src']:
                print(c['id'], 'M', c['M'], 'L', c['L'], 'O', c['O'], 'P', c['P'], 'Rev', c['Rev'])
