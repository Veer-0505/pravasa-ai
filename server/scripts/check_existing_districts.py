import json
from collections import defaultdict

data = json.load(open('server/data/places.json', encoding='utf-8'))
by_district = defaultdict(list)
for p in data:
    d = p.get('district') or 'Unknown'
    by_district[d].append(p)

for d, items in sorted(by_district.items()):
    print(f"{d}: {len(items)} existing places ({', '.join([x['name'] for x in items[:3]])}...)")

