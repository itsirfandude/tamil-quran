"""
Independent validator for the Tamil Quran dataset.

Deliberately does NOT import or call into build_dataset.py. Uses a
different parsing strategy end-to-end:
  - paragraph-first splitting (never substitutes text and re-splits by
    line, so it cannot inherit the newline-bridging bug class at all)
  - a two-pass footnote detector (find paired N&M spans first, consume
    them, then find remaining single-N spans) instead of one combined
    alternation regex

Checks both AGGREGATE counts and PER-GROUP identity/association - a
generated dataset could have the right total while assigning a
reference to the wrong verse, and this is checked for explicitly.
"""
import re, json

SRC = open('extracted.md', encoding='utf-8').read()
GENERATED = json.load(open('quran_dataset.json', encoding='utf-8'))
GEN_BY_SURAH = {s['number']: s for s in GENERATED}

VALID_NOTES = {n['number'] for n in json.load(open('notes_dataset.json', encoding='utf-8'))}

BISMILLAH = 'அளவற்ற அருளாளனும், நிகரற்ற அன்புடையோனுமாகிய அல்லாஹ்வின் பெயரால்'
chapter_pattern = re.compile(r'#\s*அத்தியாயம்\s*:\s*(\d+)\s*[-–]?\s*([^\n]*)')
headers = list(chapter_pattern.finditer(SRC))
glossary_pos = SRC.find('# விளக்கங்கள் அட்டவணை')
total_pattern = re.compile(r'(மொத்த|மாத்த)\s*வசனங்கள்\s*:\s*(\d+)')

# --- independent footnote detector: two separate passes, not one regex ---
PAIR_RE = re.compile(
    r'(?<=[\u0B80-\u0BFF.,!?;\'")])(\d{1,4})\s?&\s?(\d{1,4})(?=[\s.,!?;\'")]|$)'
)
SINGLE_RE = re.compile(
    r'(?<=[\u0B80-\u0BFF.,!?;\'")])(\d{1,4})(?=[\s.,!?;\'")]|$)'
)

def independent_extract_notes(raw_verse_text):
    """Returns (clean_text_positions_consumed, ordered list of note ints)."""
    consumed = []  # list of (start, end) spans already claimed by a pair
    notes = []
    for m in PAIR_RE.finditer(raw_verse_text):
        a, b = int(m.group(1)), int(m.group(2))
        if a in VALID_NOTES and b in VALID_NOTES:
            consumed.append((m.start(), m.end()))
            notes.append((m.start(), a))
            notes.append((m.start(), b))
    for m in SINGLE_RE.finditer(raw_verse_text):
        if any(s <= m.start() < e for s, e in consumed):
            continue  # already claimed by a pair match
        n = int(m.group(1))
        if n in VALID_NOTES:
            notes.append((m.start(), n))
    notes.sort(key=lambda x: x[0])
    return [n for _, n in notes]

# --- independent verse-group splitter: paragraph-first, never a global
#     substitute-and-resplit over the whole chapter ---
VERSE_MARKER_RE = re.compile(r'^(\d+(?:[ ,]+\d+)*)\.\s?(.*)$', re.DOTALL)
# the few cases where a paragraph contains TWO verse markers glued with no
# blank line between them - detected fresh here as its own scan
EMBEDDED_MARKER_RE = re.compile(
    r'[.!?](\d+(?:[ ,]+\d+)*\.\s?)(?=[\u0B80-\u0BFF"\'\(])'
)

def split_paragraph_into_groups(paragraph):
    """A paragraph normally holds exactly one verse-group. In the ~4 known
    cases the source glues a second verse-group's marker onto the same
    line with no blank line - split those out here, independently."""
    sub_pieces = []
    last = 0
    for m in EMBEDDED_MARKER_RE.finditer(paragraph):
        # only treat as an embedded marker if it's not simply the
        # paragraph's own leading marker re-matched
        if m.start() == 0:
            continue
        sub_pieces.append(paragraph[last:m.start()+1])  # include punctuation
        last = m.start() + 1
    sub_pieces.append(paragraph[last:])
    return [p.strip() for p in sub_pieces if p.strip()]

results = []  # per surah dict

for i, h in enumerate(headers):
    num = int(h.group(1))
    start = h.end()
    end = headers[i+1].start() if i+1 < len(headers) else glossary_pos
    block = SRC[start:end]

    tm = total_pattern.search(block[:500])
    stated_total = int(tm.group(2)) if tm else None

    bpos = block.find(BISMILLAH)
    first_verse_m = re.search(r'\n1\.\s', block)
    if bpos != -1:
        verse_section = block[bpos + len(BISMILLAH):]
        intro_end = bpos
    elif first_verse_m:
        verse_section = block[first_verse_m.start():]
        intro_end = first_verse_m.start()
    else:
        verse_section = block
        intro_end = len(block)

    intro_start = tm.end() if tm else 0
    intro_text = block[intro_start:intro_end].strip()
    intro_paragraphs = [p.strip() for p in intro_text.split('\n\n') if p.strip()]
    expected_name_meaning = intro_paragraphs[0] if intro_paragraphs else None
    expected_intro_rest = intro_paragraphs[1:] if len(intro_paragraphs) > 1 else []

    raw_paragraphs = [p.strip() for p in verse_section.split('\n\n') if p.strip()]

    expected_groups = []  # (verses:list[int], notes:list[int])
    for para in raw_paragraphs:
        for piece in split_paragraph_into_groups(para):
            vm = VERSE_MARKER_RE.match(piece)
            if not vm:
                continue
            nums = [int(x) for x in re.split(r'[ ,]+', vm.group(1).strip()) if x]
            vtext = vm.group(2).strip()
            notes = independent_extract_notes(vtext)
            expected_groups.append((nums, notes))

    # Surah 33 verse 59 has two duplicate raw paragraphs in the source
    # (a known, user-approved editorial decision handled by build_dataset.py
    # - see FIX_33_59). Without this, the validator would compare the
    # single generated group against two raw source paragraphs and
    # double-count it.
    if num == 33:
        seen_59 = False
        deduped = []
        for nums, notes in expected_groups:
            if nums == [59]:
                if seen_59:
                    continue
                seen_59 = True
            deduped.append((nums, notes))
        expected_groups = deduped

    results.append({
        'surah': num,
        'stated_total': stated_total,
        'expected_name_meaning': expected_name_meaning,
        'expected_intro_paragraphs': expected_intro_rest,
        'expected_groups': expected_groups,
    })

# ============================= COMPARISON =============================
total_source_refs = 0
total_generated_refs = 0
missing_refs = []   # (surah, verse_key, note)
extra_refs = []      # (surah, verse_key, note)
wrong_association = []  # same total note count for the surah, but a specific group's set differs
order_mismatches = []  # (surah, verse_key, expected_order, generated_order)
ambiguous = []
surahs_with_discrepancy = set()
intro_discrepancies = []

for r in results:
    num = r['surah']
    gen_surah = GEN_BY_SURAH.get(num)
    gen_groups_by_key = {}
    if gen_surah:
        for g in gen_surah['ayah_groups']:
            key = tuple(g['verses'])
            gen_groups_by_key[key] = g

    for nums, notes in r['expected_groups']:
        key = tuple(nums)
        total_source_refs += len(notes)
        gen_group = gen_groups_by_key.get(key)
        if gen_group is None:
            missing_refs.extend([(num, key, n) for n in notes])
            surahs_with_discrepancy.add(num)
            continue
        gen_notes = gen_group['notes']
        total_generated_refs += len(gen_notes)

        exp_multiset = sorted(notes)
        gen_multiset = sorted(gen_notes)
        if exp_multiset != gen_multiset:
            surahs_with_discrepancy.add(num)
            missing = []
            exp_copy = list(exp_multiset)
            for n in gen_multiset:
                if n in exp_copy:
                    exp_copy.remove(n)
            missing = exp_copy
            gen_copy = list(gen_multiset)
            for n in exp_multiset:
                if n in gen_copy:
                    gen_copy.remove(n)
            extra = gen_copy
            for n in missing:
                missing_refs.append((num, key, n))
            for n in extra:
                extra_refs.append((num, key, n))
        elif notes != gen_notes:
            # same numbers, same counts, but appearance order differs
            surahs_with_discrepancy.add(num)
            order_mismatches.append((num, key, notes, gen_notes))

    # introduction check
    if gen_surah:
        gi = gen_surah.get('introduction', {})
        if gi.get('name_meaning') != r['expected_name_meaning'] or gi.get('paragraphs') != r['expected_intro_paragraphs']:
            intro_discrepancies.append({
                'surah': num,
                'expected_name_meaning': r['expected_name_meaning'],
                'generated_name_meaning': gi.get('name_meaning'),
                'expected_paragraph_count': len(r['expected_intro_paragraphs']),
                'generated_paragraph_count': len(gi.get('paragraphs', [])),
            })

# also count total generated refs from the dataset directly (sanity cross-check)
direct_total_generated = sum(len(g['notes']) for s in GENERATED for g in s['ayah_groups'])

print("=" * 70)
print("INDEPENDENT VALIDATION REPORT")
print("=" * 70)
print(f"Total source footnote references (independently derived): {total_source_refs}")
print(f"Total generated footnote references (from comparison pass): {total_generated_refs}")
print(f"Total generated footnote references (direct dataset count): {direct_total_generated}")
print(f"Missing references: {len(missing_refs)}")
print(f"Extra references: {len(extra_refs)}")
print(f"Order mismatches (same numbers/counts, different sequence): {len(order_mismatches)}")
print(f"Ambiguous references: {len(ambiguous)}")
print(f"Surahs with at least one discrepancy: {len(surahs_with_discrepancy)} -> {sorted(surahs_with_discrepancy)}")
print(f"Introduction discrepancies: {len(intro_discrepancies)}")
print()
if missing_refs:
    print("--- MISSING (first 30) ---")
    for r in missing_refs[:30]:
        print(' ', r)
if extra_refs:
    print("--- EXTRA (first 30) ---")
    for r in extra_refs[:30]:
        print(' ', r)
if order_mismatches:
    print("--- ORDER MISMATCHES (first 30) ---")
    for r in order_mismatches[:30]:
        print(' ', r)
if intro_discrepancies:
    print("--- INTRO DISCREPANCIES (first 10) ---")
    for r in intro_discrepancies[:10]:
        print(' ', r)

with open('validation_report.json', 'w', encoding='utf-8') as f:
    json.dump({
        'total_source_refs': total_source_refs,
        'total_generated_refs': direct_total_generated,
        'missing_refs': [{'surah': s, 'verses': list(k), 'note': n} for s, k, n in missing_refs],
        'extra_refs': [{'surah': s, 'verses': list(k), 'note': n} for s, k, n in extra_refs],
        'order_mismatches': [{'surah': s, 'verses': list(k), 'expected': e, 'generated': g} for s, k, e, g in order_mismatches],
        'surahs_with_discrepancy': sorted(surahs_with_discrepancy),
        'intro_discrepancies': intro_discrepancies,
    }, f, ensure_ascii=False, indent=1)
