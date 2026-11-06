import re, json

content = open('client/src/data/karnatakaDistrictsSvg.js', encoding='utf-8').read()
matches = re.findall(r"id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameKannada:\s*'([^']+)',\s*division:\s*'([^']+)'", content)
print(f"Found {len(matches)} districts:")
for m in matches:
    print(f"{m[0]}: {m[1]} ({m[2]}) - {m[3]}")

