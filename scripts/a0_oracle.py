"""Oracle độc lập A0 — tính kỳ vọng từ chính sách đã duyệt (5 mặc định), KHÔNG gọi code TypeScript.
Đầu vào duy nhất lấy từ computeMTO cũ: kế hoạch M (NVL), L (nhân công), O (máy+SXC+add-on), Rev.
Làm tròn mô phỏng JS Math.round: floor(x+0.5)."""
import json, math
def jsr(x): return math.floor(x + 0.5)
planned = json.load(open('/tmp/planned.json'))
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
json.dump(cases, open('a0_expected.json', 'w'), ensure_ascii=False, indent=1)
print(len(cases), 'cases')
for c in cases:
    if c['src']=='denso-sensor' and c['stock']=='Valuated' and c['pct']==3.5:
        print(c)
