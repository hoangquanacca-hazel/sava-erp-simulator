"""Allow only Netlify internal-link pretty URLs and newline transport changes."""
import re
from urllib.parse import urljoin,urlsplit,urlunsplit
def canonical_html(data,base):
 s=data.decode('utf8').replace('\r\n','\n')
 def chunk(text):
  def link(m):
   value=m[3];resolved=urlsplit(urljoin(base,value));origin=urlsplit(base)
   if resolved.netloc!=origin.netloc or resolved.scheme not in ['http','https']:return m[0]
   p=resolved.path
   if p.endswith('/index.html'):p=p[:-len('index.html')]
   elif p.endswith('.html'):p=p[:-5]
   p=p.rstrip('/')or'/'
   value=urlunsplit(('', '',p,resolved.query,resolved.fragment))
   return m[1]+m[2]+value+m[2]
  return re.sub(r'(\b(?:href|src)\s*=\s*)(["\'])(.*?)\2',link,text,flags=re.I|re.S)
 # Hosting must not rewrite source/model/controls inside scripts.
 return ''.join(part if re.match(r'<script\b',part,re.I)else chunk(part)for part in re.split(r'(<script\b[^>]*>[\s\S]*?</script>)',s,flags=re.I))
def equivalent_after_pretty_urls(a,b,base):return canonical_html(a,base)==canonical_html(b,base)
def selftest():
 base='https://test.netlify.app/sap-reporting/index.html'
 a=b'<a href="./priority-24.html#P24-AP-FIORI">AP</a>\r\n<script>const native=false;</script>'
 b=b'<a href="/sap-reporting/priority-24#P24-AP-FIORI">AP</a>\n<script>const native=false;</script>'
 assert equivalent_after_pretty_urls(a,b,base)
 for changed in [b.replace(b'>AP<',b'>AR<'),b.replace(b'native=false',b'native=true'),b.replace(b'priority-24#',b'fi-aa#'),b.replace(b'/sap-reporting/',b'https://evil.invalid/sap-reporting/')]:assert not equivalent_after_pretty_urls(a,changed,base)
 assert equivalent_after_pretty_urls(b'<a href="./index.html#catalog">Back</a>',b'<a href="/sap-reporting/#catalog">Back</a>',base)
 print('PASS: internal pretty URLs accepted; text, script, route and foreign-host changes rejected.')
if __name__=='__main__':selftest()
