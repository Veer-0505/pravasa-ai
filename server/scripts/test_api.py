import urllib.request
import json
import time

time.sleep(2)
try:
    req = urllib.request.urlopen("http://localhost:5000/api/districts")
    data = json.loads(req.read().decode('utf-8'))
    print("API /api/districts:", data.get("ok"), "Districts Count:", data.get("total"))
    
    req2 = urllib.request.urlopen("http://localhost:5000/api/districts/bidar")
    data2 = json.loads(req2.read().decode('utf-8'))
    print("API /api/districts/bidar:", data2.get("ok"), "District:", data2.get("district", {}).get("name"), "Destinations:", data2.get("counts", {}).get("total"))
    
    req3 = urllib.request.urlopen("http://localhost:5000/api/districts/taluks/all")
    data3 = json.loads(req3.read().decode('utf-8'))
    print("API /api/districts/taluks/all:", data3.get("ok"), "Taluks Count:", data3.get("total"))
except Exception as e:
    print("Error:", e)

