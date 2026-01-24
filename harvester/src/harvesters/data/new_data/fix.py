import csv
from pathlib import Path

input_path = Path("illinois.csv")           # adjust path if needed
output_path = Path("illinois2.csv")

with input_path.open(newline="", encoding="utf-8") as fin, \
     output_path.open("w", newline="", encoding="utf-8") as fout:
    reader = csv.DictReader(fin)

    fieldnames = [
        "Course_Name",
        "Level",
        "Rating",
        "Skills",
        "Number of students",
        "Platform",
        "Description",          # new column
    ]
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        subject = (row.get("Subject") or "").strip()
        number = (row.get("Number") or "").strip()
        name = (row.get("Name") or "").strip()
        desc = (row.get("Description") or "").replace("\n", " ").strip()

        # Build a readable title like "ADV 200 - Data Literacy"
        if subject and number:
            title = f"{subject} {number} - {name}"
        else:
            title = name

        # Simple level heuristic from course number
        try:
            num_int = int(number)
        except ValueError:
            num_int = 0

        if num_int >= 500:
            level = 2
        elif num_int >= 300:
            level = 2
        elif num_int >= 200:
            level = 1
        elif num_int >= 100:
            level = 0
        else:
            level = 0

        writer.writerow({
            "Course_Name": title,
            "Level": level,
            "Rating": 0,
            "Skills": desc,          # can also derive keywords later
            "Number of students": 0,
            "Platform": "Illinois",
            "Description": desc,     # keep original description text
        })

print(f"Wrote normalized CSV to {output_path}")
