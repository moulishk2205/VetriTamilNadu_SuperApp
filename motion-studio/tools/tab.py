import json,sys
run, prefix = sys.argv[1], sys.argv[2]
J=f'/Users/chandyfolder/.claude/projects/-Users-chandyfolder-vetri-app/35c0196d-d51f-4191-a478-180f2c547235/subagents/workflows/{run}/journal.jsonl'
rows=[json.loads(l) for l in open(J) if l.strip()]
lab={r['agentId']:r['label'].split(':')[1] for r in rows if r['type']=='started'}
data=[]
for r in rows:
    if r['type']=='result':
        d=r['result']; d=json.loads(d) if isinstance(d,str) else d; d['lens']=lab[r['agentId']]; data.append(d)
order=['comprehension','motion','legibility-sound','legibility','sound','client','tamil','typography','colour','risk','qc']; data.sort(key=lambda d: order.index(d['lens']) if d['lens'] in order else 99)
json.dump(data,open(f'out/review/{prefix}_critics.json','w'),indent=1)
L=[d['lens'] for d in data]
out=['%-28s'%'criterion'+''.join('%9s'%l[:8] for l in L)+'     mean']
allv=[]
for k in data[0]['scores']:
    v=[d['scores'][k] for d in data]; allv+=v; out.append('%-28s'%k+''.join('%9s'%x for x in v)+'   %6.2f'%(sum(v)/len(v)))
out.append('')
for k in data[0]['scenes']:
    v=[d['scenes'][k] for d in data]; allv+=v; out.append('%-28s'%k+''.join('%9s'%x for x in v)+'   %6.2f'%(sum(v)/len(v)))
out.append('\nOVERALL MEAN %.2f   MIN %.1f'%(sum(allv)/len(allv), min(allv)))
for d in data:
    out.append('\n===== '+d['lens'])
    for f in d['fixes']: out.append(f"- [{f['t']}] ({f['impact']}) {f['problem']}\n  CHANGE: {f['change']}")
    out.append('QC:'); [out.append(f"  {q['answer']:7s} {q['q']} — {q['why']}") for q in d['qc']]
open(f'out/review/{prefix}_report.txt','w').write('\n'.join(out))
print('\n'.join(out[:29]))
