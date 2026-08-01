import re, json

text = open('extracted.md', encoding='utf-8').read()
start = text.find('#  விளக்கங்கள்')
if start == -1:
    start = text.find('# விளக்கங்கள்', text.find('அத்தியாயம் : 114'))
section = text[start:]

heading_re = re.compile(r'^##\s*(\d+)\.?\s*(.*)$', re.M)
matches = list(heading_re.finditer(section))

notes = {}
order = []
for i, m in enumerate(matches):
    num = int(m.group(1))
    title = m.group(2).strip()
    body_start = m.end()
    body_end = matches[i+1].start() if i+1 < len(matches) else len(section)
    body = section[body_start:body_end].strip()
    # collapse blank-line-separated paragraphs into clean paragraphs list
    paragraphs = [p.strip() for p in body.split('\n\n') if p.strip()]
    if num in notes:
        # duplicate heading artifact - merge (keep non-empty title/body)
        if not notes[num]['title'] and title:
            notes[num]['title'] = title
        if paragraphs and not notes[num]['paragraphs']:
            notes[num]['paragraphs'] = paragraphs
        continue
    notes[num] = {'number': num, 'title': title, 'paragraphs': paragraphs}
    order.append(num)

print('total notes:', len(notes))
nums = sorted(notes.keys())
missing = sorted(set(range(1, max(nums)+1)) - set(nums))
print('missing:', missing)
empty_body = [n for n in nums if not notes[n]['paragraphs']]
print('empty body notes:', empty_body)

with open('notes_dataset.json', 'w', encoding='utf-8') as f:
    json.dump([notes[n] for n in nums], f, ensure_ascii=False, indent=1)

# sample
print(json.dumps(notes[1], ensure_ascii=False, indent=2)[:500])
print(json.dumps(notes[26], ensure_ascii=False, indent=2)[:500])
