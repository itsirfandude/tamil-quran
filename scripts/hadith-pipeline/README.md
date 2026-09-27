# Hadith Data Pipeline

This pipeline imports only the reviewed, explicit Al-Arba'in Nawawi source
records. It does not discover records from the site or modify Quran data.

```bash
# Read-only preflight. Fetches the 50 reviewed primary records and prints a
# summary, including records 1, 10, 23, 42, and 50. It writes nothing.
python3 scripts/hadith-pipeline/extract_arbaeen_nawawi.py --dry-run

# Generate public/data/hadith/ after the preflight has been reviewed.
python3 scripts/hadith-pipeline/extract_arbaeen_nawawi.py

# Validate the generated dataset and write validation_report.json.
python3 scripts/hadith-pipeline/validate_arbaeen_nawawi.py
```

The source manifest is deliberately embedded in the extractor. It is a
reviewed 1–50 mapping from the collection page, rather than a crawler or a
URL-discovery mechanism. The collection page establishes membership and all
listed references; one primary linked record supplies the reader content.
