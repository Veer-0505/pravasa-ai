with open('client/src/data/karnatakaDistrictsSvg.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('"id": "haveri"')
if pos != -1:
    print(text[pos:pos+1500])

