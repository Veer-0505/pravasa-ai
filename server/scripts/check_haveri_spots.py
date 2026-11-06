with open('client/src/data/karnatakaDistrictsSvg.js', 'r', encoding='utf-8') as f:
    text = f.read()

import json, re

# Find topSpots for haveri
m = re.search(r'"id":\s*"haveri".*?"topSpots":\s*(\[.*?\])\s*,', text, re.DOTALL)
if m:
    print("Haveri topSpots:")
    print(m.group(1))
else:
    print("Could not match haveri topSpots")

