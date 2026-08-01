import re, json

with open('extracted.md', encoding='utf-8') as f:
    text = f.read()

chapter_pattern = re.compile(r'#\s*அத்தியாயம்\s*:\s*(\d+)\s*[-–]?\s*([^\n]*)')
headers = list(chapter_pattern.finditer(text))
glossary_pos = text.find('# விளக்கங்கள் அட்டவணை')
total_pattern = re.compile(r'(மொத்த|மாத்த)\s*வசனங்கள்\s*:\s*(\d+)')

# split embedded mid-paragraph verse markers onto their own line
midline_split = re.compile(r'(?<=\S)(?=\s*\d+(?:\s*,\s*\d+)*\.\s?[\u0B80-\u0BFF"\'\(])')
# more precise: only split right after a sentence-ending period followed immediately by digits+period
midline_split2 = re.compile(r'([.!?])(\d+(?:[ ,]+\d+)*\.[ ]?)(?=[\u0B80-\u0BFF"\'\(])')

verse_start = re.compile(r'^(\d+(?:[,\s]+\d+)*)\.\s?(.*)$', re.DOTALL)

arabic = json.load(open('arabic_quran.json', encoding='utf-8'))
arabic_by_surah = {s['id']: s['verses'] for s in arabic}
arabic_totals = {s['id']: s['total_verses'] for s in arabic}

# Footnote markers: a run of digits immediately glued (no space) to the
# preceding Tamil letter or closing punctuation - the convention this
# translation uses for its numbered explanatory notes (1-521, see the
# "விளக்கங்கள்" appendix). A genuine quantity in the translation always has
# a space before it, so this pattern is safe. The source also sometimes
# cites two notes together joined by '&' (e.g. "26&475" = see notes 26
# and 475) with no space either side - handled as its own alternative so
# both numbers are captured as separate references.
footnote_re = re.compile(
    r'(?<=[\u0B80-\u0BFF.,!?\'")])(\d{1,4})\s?&\s?(\d{1,4})(?=[\s.,!?\'")]|$)'
    r'|(?<=[\u0B80-\u0BFF.,!?\'")])(\d{1,4})(?=[\s.,!?\'")]|$)'
)

VALID_NOTE_MAX = 521

def split_footnotes(vtext):
    notes_found = []

    def repl(m):
        if m.group(1) is not None:  # paired "N&M" form
            a, b = int(m.group(1)), int(m.group(2))
            if 1 <= a <= VALID_NOTE_MAX and 1 <= b <= VALID_NOTE_MAX:
                notes_found.extend([a, b])
                return f'\u00a4{a}\u00a4\u00a4{b}\u00a4'
            return m.group(0)
        n = int(m.group(3))
        if 1 <= n <= VALID_NOTE_MAX:
            notes_found.append(n)
            return f'\u00a4{n}\u00a4'
        return m.group(0)  # leave unrecognised numbers untouched

    marked = footnote_re.sub(repl, vtext)
    return marked, notes_found


FIX_33_59 = "நபியே! (முஹம்மதே!) உமது மனைவியருக்கும், உமது புதல்வியருக்கும், நம்பிக்கை கொண்டவர்களின் மனைவியருக்கும் முக்காடுகளைத் தங்கள் மீது தொங்க விடுமாறு கூறுவீராக!472 அவர்கள் அறியப்படவும், தொல்லைப்படுத்தப்படாமல் இருக்கவும் இது ஏற்றது.''300 அல்லாஹ் மன்னிப்பவனாகவும், நிகரற்ற அன்புடையோனாகவும் இருக்கிறான்."

BISMILLAH = 'அளவற்ற அருளாளனும், நிகரற்ற அன்புடையோனுமாகிய அல்லாஹ்வின் பெயரால்'

def extract_introduction(block, total_match):
    """Everything between the 'total verses' line and the Bismillah (or,
    for the one Surah with no Bismillah, the first verse marker) is the
    Surah's introduction: a name/meaning line, then zero or more
    explanatory paragraphs. Extracted verbatim, no rewriting."""
    intro_start = total_match.end() if total_match else 0
    bpos = block.find(BISMILLAH)
    first_verse = re.search(r'\n1\.\s', block)
    if bpos != -1:
        intro_end = bpos
    elif first_verse:
        intro_end = first_verse.start()
    else:
        intro_end = len(block)
    intro_text = block[intro_start:intro_end].strip()
    paragraphs = [p.strip() for p in intro_text.split('\n\n') if p.strip()]
    name_meaning = paragraphs[0] if paragraphs else None
    rest = paragraphs[1:] if len(paragraphs) > 1 else []
    return {'name_meaning': name_meaning, 'paragraphs': rest}

surahs_out = []
problems = []

for i, h in enumerate(headers):
    num = int(h.group(1))
    name = h.group(2).strip()
    start = h.end()
    end = headers[i+1].start() if i+1 < len(headers) else (glossary_pos if glossary_pos != -1 else len(text))
    block = text[start:end]

    m = total_pattern.search(block[:500])
    stated_total = int(m.group(2)) if m else None

    introduction = extract_introduction(block, m)

    # split any mid-paragraph verse markers onto new lines
    block = midline_split2.sub(lambda mo: mo.group(1) + '\n\n' + mo.group(2), block)

    lines = block.split('\n')
    groups = []  # list of (nums:list[int], text:str)
    for l in lines:
        l = l.strip()
        if not l:
            continue
        mm = verse_start.match(l)
        if mm:
            nums = [int(x) for x in re.split(r'[,\s]+', mm.group(1).strip()) if x]
            vtext = mm.group(2).strip()
            groups.append((nums, vtext))

    # dedupe/fix ch33 v59
    if num == 33:
        fixed = []
        seen59 = False
        for nums, vtext in groups:
            if nums == [59]:
                if seen59:
                    continue  # drop the duplicate (first one already added -- but we want to KEEP fixed text)
                seen59 = True
                fixed.append((nums, FIX_33_59))
            else:
                fixed.append((nums, vtext))
        groups = fixed

    flat = [n for g,_ in groups for n in g]
    max_found = max(flat) if flat else 0
    missing = sorted(set(range(1, max_found+1)) - set(flat))
    dupes = sorted(set(x for x in flat if flat.count(x) > 1))
    if missing or dupes or stated_total != max_found:
        problems.append({'num': num, 'name': name, 'stated_total': stated_total,
                          'max_found': max_found, 'missing': missing, 'dupes': dupes})

    # merge arabic
    arab_verses = arabic_by_surah.get(num, [])
    offset = 1 if num == 1 else 0  # Al-Fatihah: arabic ayah1=Bismillah, tamil verse1=arabic ayah2
    arab_by_id = {v['id']: v['text'] for v in arab_verses}

    ayah_entries = []
    for nums, vtext in groups:
        arabic_texts = []
        for n in nums:
            aid = n + offset
            arabic_texts.append(arab_by_id.get(aid, ''))
        marked_tamil, notes_found = split_footnotes(vtext)
        ayah_entries.append({
            'verses': nums,
            'tamil': marked_tamil,
            'arabic': ' '.join(arabic_texts),
            'notes': notes_found,
        })

    surahs_out.append({
        'number': num,
        'name_tamil': name,
        'stated_total_verses': stated_total,
        'introduction': introduction,
        'ayah_groups': ayah_entries
    })

with open('quran_dataset.json', 'w', encoding='utf-8') as f:
    json.dump(surahs_out, f, ensure_ascii=False, indent=1)

print(f"Surahs built: {len(surahs_out)}")
print(f"Problems remaining: {len(problems)}")
for p in problems:
    print(p)

# spot check arabic merge for surah 1
s1 = surahs_out[0]
for g in s1['ayah_groups']:
    print(g['verses'], '|', g['tamil'][:40], '|', g['arabic'][:40])
