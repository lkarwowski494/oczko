import json,sys,hashlib
p,ref=sys.argv[1],sys.argv[2]
d=None
for line in open(p,encoding='utf-8'):
    line=line.strip()
    if line.startswith('{'):
        d=json.loads(line); break
c=d.get('ccr',d); evs=c.get('data') or []
print('zdarzeń',len(evs))
def texts(o):
    if isinstance(o,str): yield o
    elif isinstance(o,dict):
        for v in o.values(): yield from texts(v)
    elif isinstance(o,list):
        for v in o: yield from texts(v)
want=open(ref,'rb').read()
hw=hashlib.sha256(want).hexdigest()
evs.sort(key=lambda e:e.get("created_at",""))
best=max((t for t in texts(evs[0])),key=len)
b=best.encode('utf-8')
print('plik',len(want),hw[:16]); print('sesja',len(b),hashlib.sha256(b).hexdigest()[:16], evs[0].get('created_at'))
print('ZGODNE' if b==want else ('ZGODNE bez końcowego \\n' if b==want.rstrip(b'\n') or b.rstrip(b'\n')==want.rstrip(b'\n') else 'RÓŻNE'))
if b.rstrip(b'\n')!=want.rstrip(b'\n'):
    i=next((k for k in range(min(len(b),len(want))) if b[k]!=want[k]),min(len(b),len(want)))
    print('pierwsza różnica bajt',i, want[max(0,i-60):i+60].decode('utf-8','replace').replace('\n','⏎'),'|||',b[max(0,i-60):i+60].decode('utf-8','replace').replace('\n','⏎'))
