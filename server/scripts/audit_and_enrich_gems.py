import json
import os

with open('server/data/places.json', 'r', encoding='utf-8') as f:
    places = json.load(f)

districts = {}
for p in places:
    d = p.get('district', 'Unknown')
    if d not in districts:
        districts[d] = {'total': 0, 'hidden': 0}
    districts[d]['total'] += 1
    status = p.get('hiddenGemClassification', {}).get('status')
    if status in ['hidden_gem', 'lesser_known'] or p.get('offbeat'):
        districts[d]['hidden'] += 1

print("Total places:", len(places))
print("Districts present:", len(districts))
for d in sorted(districts.keys()):
    print(f"  {d}: total={districts[d]['total']}, hidden={districts[d]['hidden']}")

