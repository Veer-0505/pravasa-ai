import urllib.request
import json

queries = [
    ("English Place Lookup", "Tell me about Bidar Fort"),
    ("Kannada District Query", "ಬೀದರ್ ಜಿಲ್ಲೆಯ ಪ್ರಮುಖ ತಾಣಗಳು ಯಾವುವು?"),
    ("English Hidden Gems", "What are the best hidden gems in Karnataka?"),
    ("Kannada Hidden Gems", "ಕರ್ನಾಟಕದ ಅತ್ಯುತ್ತಮ ಗುಪ್ತ ಪ್ರವಾಸಿ ತಾಣಗಳು"),
    ("English Waterfalls", "Tell me about Jog Falls in Shivamogga"),
    ("English Distance", "How far is Hampi from Badami?"),
    ("Kannada Trip Plan", "ಕೂರ್ಗ್ 3 ದಿನಗಳ ಪ್ರವಾಸ ಯೋಜನೆ")
]

print("=" * 60)
print("TESTING PRAVASA AI BILINGUAL CHATBOT")
print("=" * 60)

passed = 0
for name, q in queries:
    try:
        data = json.dumps({"message": q, "language": "kn" if any(ord(c) > 127 for c in q) else "en"}).encode('utf-8')
        req = urllib.request.Request("http://localhost:5000/api/chat", data=data, headers={"Content-Type": "application/json"})
        res = urllib.request.urlopen(req)
        resp = json.loads(res.read().decode('utf-8'))
        answer = resp.get("reply", "") or resp.get("message", "")
        cards = resp.get("cards", [])
        print(f"\n[PASS] {name} ('{q[:30]}...')")
        print(f"       Reply ({len(answer)} chars): {answer[:90]}...")
        if cards:
            print(f"       Returned {len(cards)} cards: {[c.get('name') for c in cards[:2]]}")
        passed += 1
    except Exception as e:
        print(f"\n[FAIL] {name}: {e}")

print(f"\nResults: {passed}/{len(queries)} PASSED")

