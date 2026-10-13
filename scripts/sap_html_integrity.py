"""Allow only Netlify internal-link pretty URLs and newline transport changes."""
import re
import json
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,urlunsplit
def canonical_html(data,base):
 s=data.decode('utf8').replace('\r\n','\n')
 def link(value):
   resolved=urlsplit(urljoin(base,value));origin=urlsplit(base)
   if resolved.netloc!=origin.netloc or resolved.scheme not in ['http','https']:return value
   p=resolved.path
   if p.endswith('/index.html'):p=p[:-len('index.html')]
   elif p.endswith('.html'):p=p[:-5]
   p=p.rstrip('/')or'/'
   return urlunsplit(('', '',p,resolved.query,resolved.fragment))
 def chunk(text):
  class Tags(HTMLParser):
   def __init__(self):super().__init__(convert_charrefs=False);self.offsets=[0]+[m.end()for m in re.finditer('\n',text)];self.replacements=[]
   def tag(self,tag,attrs,end=False):
    row,c=self.getpos();start=self.offsets[row-1]+c;raw=self.get_starttag_text()
    attrs=sorted(attrs,key=lambda a:a[0])
    value='<'+tag+''.join(' '+k+(('='+json.dumps(link(v)if k in['href','src']else v,ensure_ascii=False))if v is not None and not(k in ['open','download','disabled','checked','selected','multiple','required','autofocus']and v=='')else'')for k,v in attrs)+('/>'if end else'>')
    self.replacements.append((start,start+len(raw),value))
   def handle_starttag(self,tag,attrs):self.tag(tag,attrs)
   def handle_startendtag(self,tag,attrs):self.tag(tag,attrs,True)
  p=Tags();p.feed(text)
  parts=[];last=0
  for start,end,value in p.replacements:parts.extend([text[last:start],value]);last=end
  parts.append(text[last:]);return ''.join(parts)
 # Hosting must not rewrite source/model/controls inside scripts.
 return ''.join(part if re.match(r'<script\b',part,re.I)else chunk(part)for part in re.split(r'(<script\b[^>]*>[\s\S]*?</script>)',s,flags=re.I))
def equivalent_after_pretty_urls(a,b,base):return canonical_html(a,base)==canonical_html(b,base)
def without_preview_toolbar(data,site_id,deploy_id):
 pattern=(r'<div data-netlify-deploy-id="'+re.escape(deploy_id)+r'" data-netlify-site-id="'+re.escape(site_id)+r'" data-vcs="github" style="position:fixed">\s*<script async src="/\.netlify/scripts/cdp"></script>\s*</div>\s*(?=</body>)')
 return re.sub(pattern,'',data.decode('utf8'),count=1).encode('utf8')
def selftest():
 base='https://test.netlify.app/sap-reporting/index.html'
 a=b'<a href="./priority-24.html#P24-AP-FIORI">AP</a>\r\n<script>const native=false;</script>'
 b=b'<a href="/sap-reporting/priority-24#P24-AP-FIORI">AP</a>\n<script>const native=false;</script>'
 assert equivalent_after_pretty_urls(a,b,base)
 for changed in [b.replace(b'>AP<',b'>AR<'),b.replace(b'native=false',b'native=true'),b.replace(b'priority-24#',b'fi-aa#'),b.replace(b'/sap-reporting/',b'https://evil.invalid/sap-reporting/')]:assert not equivalent_after_pretty_urls(a,changed,base)
 assert equivalent_after_pretty_urls(b'<a href="./index.html#catalog">Back</a>',b'<a href="/sap-reporting/#catalog">Back</a>',base)
 assert equivalent_after_pretty_urls(b'<a href="./x.html" style="color:red">X</a>',b"<a href='/sap-reporting/x' style='color:red'>X</a>",base)
 assert not equivalent_after_pretty_urls(b'<a style="color:red">X</a>',b"<a style='color:blue'>X</a>",base)
 assert equivalent_after_pretty_urls(b'<a style="color:red" download href="./x.csv">X</a>',b'<a href="/sap-reporting/x.csv" download="" style="color:red">X</a>',base)
 toolbar=b'<div data-netlify-deploy-id="D1" data-netlify-site-id="S1" data-vcs="github" style="position:fixed"><script async src="/.netlify/scripts/cdp"></script></div>'
 assert without_preview_toolbar(b'<body>X'+toolbar+b'</body>','S1','D1')==b'<body>X</body>'
 assert without_preview_toolbar(b'<body>X'+toolbar.replace(b'cdp',b'evil')+b'</body>','S1','D1')!=b'<body>X</body>'
 print('PASS: internal pretty URLs accepted; text, script, route and foreign-host changes rejected.')
if __name__=='__main__':selftest()
