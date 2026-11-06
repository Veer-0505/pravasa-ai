import json, re, urllib.request

with open('client/src/data/karnatakaDistrictsSvg.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Mysuru Palace 404
content = content.replace(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Mysore_Palace_Morning.jpg/1280px-Mysore_Palace_Morning.jpg',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80'
)

# Fix Haveri cardamom image
content = content.replace(
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Cardamom_dry.jpg/960px-Cardamom_dry.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    'https://images.unsplash.com/photo-1600100397608-f010e47c9451?w=800&auto=format&fit=crop&q=80'
)

with open('client/src/data/karnatakaDistrictsSvg.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("karnatakaDistrictsSvg.js updated successfully.")

