with open('client/src/data/tourismModulesData.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pos = text.find('TREKKING_DESTINATIONS')
if pos != -1:
    print(text[pos:pos+2000])

