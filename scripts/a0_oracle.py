"""Oracle độc lập A0 — tính kỳ vọng từ chính sách đã duyệt (5 mặc định), KHÔNG gọi code TypeScript.
Đầu vào: kế hoạch M (NVL), L (nhân công), O (máy+SXC+add-on), Rev — S3: lấy từ oracle giá thành độc lập
scripts/oracle_costing.py (tham số preset), KHÔNG còn đọc /tmp/planned.json sinh từ computeMTO (TS).
  python3 scripts/a0_oracle.py          → ghi scripts/a0_expected.json
  python3 scripts/a0_oracle.py --check  → exit 1 nếu file trong repo khác kết quả oracle
Làm tròn mô phỏng JS Math.round: floor(x+0.5)."""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oracle_costing import planned_by_preset
def jsr(x): return math.floor(x + 0.5)
planned = planned_by_preset()
cases = []
for pid, d in planned.items():
    M, L, O, Rev = d['M'], d['L'], d['O'], d['Rev']
    P = M + L + O
    assert P == d['P']
    for stock in ('Valuated', 'Non-valuated'):
        for pct in (3.5, 0, -3.5):
            for r in (1.0, 0.5, 0.0):
                D = jsr(P * pct / 100)
                dM = jsr(D * M / P); dL = jsr(D * L / P); dO = D - dM - dL
                A = P + D
                rs = lambda x: jsr(x * r)
                if stock == 'Valuated':
                    gr = rs(P); dv = rs(D)
                    wip154 = A - gr - dv          # Nợ − Có của 154 (dương = dư Nợ)
                    inv155 = gr - rs(P)            # PGI ghi Có 155 = rs(P) => 0
                    cogs632_net = dv               # 632: Nợ dv (bất lợi) / Có |dv| (thuận lợi) rồi kết chuyển 911 => 0 sau đóng
                else:
                    gr = 0; dv = rs(D)
                    wip154 = A - rs(A)
                    inv155 = 0
                recognized = rs(P) + rs(D)
                closing632 = 0 if stock == 'Valuated' else rs(A) - recognized
                gp911 = rs(Rev) - recognized   # dư Có 911 (lãi gộp)
                cases.append(dict(src=pid, stock=stock, pct=pct, ratio=r, P=P, delta=D, dM=dM, dL=dL, dO=dO,
                    actual=A, cr152=M+dM, cr334=L+dL, cr214=O+dO, wip154_dr_minus_cr=wip154, closing155=inv155,
                    gp911_credit=gp911, closing632_dr_minus_cr=closing632, revenue_recognized=rs(Rev)))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'a0_expected.json')
text = json.dumps(cases, ensure_ascii=False, indent=1)
if '--stdout' in sys.argv:
    sys.stdout.write(text); sys.exit(0)
if '--check' in sys.argv:
    if open(OUT, encoding='utf-8').read().rstrip('\n') != text:
        print('FAIL a0_expected.json khác kết quả oracle — không sửa tay đáp án; chạy lại oracle'); sys.exit(1)
    print(f'PASS a0_expected.json = oracle ({len(cases)} ca)'); sys.exit(0)
open(OUT, 'w', encoding='utf-8').write(text)
print(len(cases), 'cases')
for c in cases:
    if c['src']=='denso-sensor' and c['stock']=='Valuated' and c['pct']==3.5:
        print(c)
