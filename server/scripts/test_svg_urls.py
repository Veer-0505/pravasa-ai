import re

with open('client/src/data/karnatakaDistrictsSvg.js', 'r', encoding='utf-8') as f:
    text = f.read()

urls = re.findall(r'https?://[^\s"\'\)]+', text)
print(f"Total URLs in karnatakaDistrictsSvg.js: {len(urls)}")
for u in urls[:15]:
    print(" ", u)

