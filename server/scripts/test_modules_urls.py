import urllib.request, re

with open('client/src/data/tourismModulesData.js', 'r', encoding='utf-8') as f:
    text = f.read()

urls = re.findall(r'https?://[^\s"\'\)]+', text)
img_urls = [u for u in urls if any(ext in u.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', 'unsplash', 'wikimedia'])]
print(f"Total image URLs in tourismModulesData: {len(img_urls)}")
for u in img_urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=3)
        print("OK", res.status, u[:60])
    except Exception as e:
        print("FAIL", e, u[:70])

