from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];PUB=ROOT/'public/sap-reporting'
p=ROOT/'scripts/sap-priority-24-viewer.html';s=p.read_text(encoding='utf8').replace('href="./#catalog"','href="./index.html#catalog"').replace("typeof c==='string'?c:JSON.stringify(c)","typeof c==='string'?c:(c.label+': '+c.value)")
s=s.replace("if(rows.length&&!rows.some(p=>p.view_id===selected))choose(rows[0].view_id);else $('#picker').value=selected;", "if(!rows.length){selected='';$('#sample').textContent='Không có nhu cầu phù hợp. Hãy đổi từ khóa hoặc phân hệ.';}else if(!rows.some(p=>p.view_id===selected))choose(rows[0].view_id);else $('#picker').value=selected;")
p.write_text(s,encoding='utf8');m=json.loads((PUB/'priority-24.json').read_text(encoding='utf8'))
m['phase_status']=[['Giai đoạn 1','45–60 báo cáo FI/CO/MM chuyên sâu','Có hồ sơ và mẫu; độ sâu, hệ mục tiêu và nghiệm thu còn mở.'],['Giai đoạn 2','Mục tiêu 150 hồ sơ sản xuất','Đạt mục tiêu số lượng; còn khoảng trống nghiệp vụ và bố cục nguồn.'],['Giai đoạn 3','200–250 hồ sơ, Fiori, Power BI và kết nối','Đang mở rộng; chưa hoàn tất hoặc nghiệm thu kết nối.']]
(PUB/'priority-24.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf8');(PUB/'priority-24.html').write_text(s.replace('__MODEL__',json.dumps(m,ensure_ascii=False).replace('<',r'\u003c')),encoding='utf8')
print('Finalized standalone viewer and readable phase status.')
