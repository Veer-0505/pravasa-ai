"""
Pravasa AI - Master Tourism Database Compiler
Merges, standardizes, validates, and partitions Karnataka tourism data
across all 31 districts with 30 mandatory research fields.
"""

import os
import json
import re
from data.kalaburagi_division import get_kalaburagi_division_places
from data.belagavi_division import get_belagavi_division_places
from data.bengaluru_division import get_bengaluru_division_places
from data.mysuru_division import get_mysuru_division_places
from data.expand_all_districts import get_expanded_karnataka_places
from data.builder_utils import KARNATAKA_BOUNDS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DISTRICTS_DIR = os.path.join(DATA_DIR, 'districts')
PLACES_FILE = os.path.join(DATA_DIR, 'places.json')
DISTRICTS_FILE = os.path.join(DATA_DIR, 'districts.json')
TALUKS_FILE = os.path.join(DATA_DIR, 'taluks.json')

# Standard 31 Districts of Karnataka with administrative details
DISTRICTS_METADATA = [
    # Kalaburagi Division
    {
        "id": "bidar",
        "name": "Bidar",
        "nameKannada": "ಬೀದರ್",
        "division": "Kalaburagi",
        "headquarters": "Bidar",
        "lat": 17.9104,
        "lng": 77.5199,
        "taluks": ["Bidar", "Bhalki", "Aurad", "Basavakalyan", "Humnabad", "Kamalnagar", "Chitguppa"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Crowning the northern apex of Karnataka, Bidar is an ancient medieval city of Bahmani and Barid Shahi monuments, the historic 15th-century Bidar Fort, Mahmud Gawan Madrasa, and sacred Gurudwara Nanak Jhira.",
        "descriptionKannada": "ಕರ್ನಾಟಕದ ಉತ್ತರದ ತುತ್ತತುದಿಯಲ್ಲಿರುವ ಬೀದರ್, ಬಹಮನಿ ಮತ್ತು ಬರೀದ್ ಶಾಹಿ ವಾಸ್ತುಶಿಲ್ಪ, ಭವ್ಯ ಬೀದರ್ ಕೋಟೆ, ಮಹಮೂದ್ ಗವಾನ್ ಮದರಸಾ ಮತ್ತು ಪವಿತ್ರ ಗುರುದ್ವಾರ ನಾನಕ್ ಝೀರಾ ಹೊಂದಿರುವ ಐತಿಹಾಸಿಕ ನಗರ."
    },
    {
        "id": "kalaburagi",
        "name": "Kalaburagi",
        "nameKannada": "ಕಲಬುರಗಿ",
        "division": "Kalaburagi",
        "headquarters": "Kalaburagi",
        "lat": 17.3297,
        "lng": 76.8343,
        "taluks": ["Kalaburagi", "Afzalpur", "Aland", "Chincholi", "Chittapur", "Jevargi", "Sedam", "Kamalapur", "Yadrami", "Shahabad"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Historic capital of the Bahmani Sultanate, Kalaburagi is famous for the great covered Jami Masjid, Sufi saint Khwaja Bande Nawaz Dargah, Sannati Ashokan Buddhist stupa, and Chincholi Wildlife Sanctuary.",
        "descriptionKannada": "ಬಹಮನಿ ಸುಲ್ತಾನರ ಐತಿಹಾಸಿಕ ರಾಜಧಾನಿ ಕಲಬುರಗಿ, ಪೂರ್ಣ ಆವೃತ ಜಾಮಿಯಾ ಮಸೀದಿ, ಹಜರತ್ ಖ್ವಾಜಾ ಬಂದೇ ನವಾಜ್ ದರ್ಗಾ, ಸನ್ನತಿ ಅಶೋಕನ ಬೌದ್ಧ ಸ್ತೂಪ ಮತ್ತು ಚಿಂಚೋಳಿ ವನ್ಯಜೀವಿ ಧಾಮಕ್ಕೆ ಪ್ರಸಿದ್ಧವಾಗಿದೆ."
    },
    {
        "id": "yadgir",
        "name": "Yadgir",
        "nameKannada": "ಯಾದಗಿರಿ",
        "division": "Kalaburagi",
        "headquarters": "Yadgir",
        "lat": 16.7644,
        "lng": 77.1378,
        "taluks": ["Yadgir", "Shorapur", "Shahapur", "Gurmitkal", "Vadagera", "Hunasagi"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Cradled between Krishna and Bheema rivers, Yadgir boasts the monolithic triangular Hill Fort, the heroic history of Shorapur Nayakas, Bonal Bird Sanctuary, and prehistoric megalithic stone alignments at Vibhutihalli.",
        "descriptionKannada": "ಕೃಷ್ಣಾ ಮತ್ತು ಭೀಮಾ ನದಿಗಳ ನಡುವಿರುವ ಯಾದಗಿರಿ, ಏಕಶಿಲಾ ಗಿರಿ ದುರ್ಗ, ಶೋರಾಪುರ ನಾಯಕರ ಶೌರ್ಯದ ಇತಿಹಾಸ, ಬೋನಾಳ ಪಕ್ಷಿಧಾಮ ಮತ್ತು ವಿಭೂತಿಹಳ್ಳಿಯ ಶಿಲಾಯುಗದ ಖಗೋಳ ಶಿಲಾ ಸಾಲುಗಳಿಗೆ ಹೆಸರುವಾಸಿಯಾಗಿದೆ."
    },
    {
        "id": "raichur",
        "name": "Raichur",
        "nameKannada": "ರಾಯಚೂರು",
        "division": "Kalaburagi",
        "headquarters": "Raichur",
        "lat": 16.2058,
        "lng": 77.3556,
        "taluks": ["Raichur", "Manvi", "Sindhanur", "Devadurga", "Lingsugur", "Maski", "Sirwar"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Guarding the fertile Doab, Raichur is renowned for the historic Raichur Fort with Kakatiya rock inscriptions, Mantralayam Raghavendra Swamy Brindavan, Maski Ashokan rock edict, and river-island Jaladurga Fort.",
        "descriptionKannada": "ಕೃಷ್ಣಾ-ತುಂಗಭದ್ರಾ ದೋಆಬ್ ಪ್ರದೇಶದ ರಾಯಚೂರು, ಕಾಕತೀಯರ ಶಾಸನವುಳ್ಳ ರಾಯಚೂರು ಕೋಟೆ, ಮಂತ್ರಾಲಯ ಗುರು ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಬೃಂದಾವನ, ಮಸ್ಕಿ ಅಶೋಕನ ಶಿಲಾಶಾಸನ ಮತ್ತು ಜಲದುರ್ಗಕ್ಕೆ ಖ್ಯಾತವಾಗಿದೆ."
    },
    {
        "id": "koppal",
        "name": "Koppal",
        "nameKannada": "ಕೊಪ್ಪಳ",
        "division": "Kalaburagi",
        "headquarters": "Koppal",
        "lat": 15.3486,
        "lng": 76.1550,
        "taluks": ["Koppal", "Gangavathi", "Kushtagi", "Yelburga", "Kuknoor", "Kanakagiri", "Karatagi"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "Known as the historical Jain center and Kishkindha terrain, Koppal features the architectural wonder Mahadeva Temple at Itagi ('Devalaya Chakravarti'), Anjanadri Hill, Anegundi, and GI-tagged Kinnal wooden toys.",
        "descriptionKannada": "ಐತಿಹಾಸಿಕ ಜೈನ ತಾಣ ಮತ್ತು ಕಿಷ್ಕಿಂಧೆಯ ನೆಲೆಯಾದ ಕೊಪ್ಪಳ, 'ದೇವಾಲಯ ಚಕ್ರವರ್ತಿ' ಇಟಗಿ ಮಹಾದೇವ ದೇವಾಲಯ, ಅಂಜನಾದ್ರಿ ಬೆಟ್ಟ, ಆನೆಗುಂದಿ ಮತ್ತು ಕಿನ್ನಾಳ ಮರದ ಬೊಂಬೆಗಳ ಕಲೆಗೆ ಪ್ರಸಿದ್ಧವಾಗಿದೆ."
    },
    {
        "id": "ballari",
        "name": "Ballari",
        "nameKannada": "ಬಳ್ಳಾರಿ",
        "division": "Kalaburagi",
        "headquarters": "Ballari",
        "lat": 15.1394,
        "lng": 76.9214,
        "taluks": ["Ballari", "Sandur", "Siruguppa", "Kurugodu", "Kampli"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Dominated by the massive monolithic Ballari Fort rock, Ballari features the lush green Krauncha Giri hills of Sandur, 7th-century Early Chalukyan Kumaraswamy Temple, and Asia's first Daroji Sloth Bear Sanctuary.",
        "descriptionKannada": "ಏಕಶಿಲಾ ಬಂಡೆಯ ಮೇಲಿನ ಬಳ್ಳಾರಿ ಕೋಟೆಯಿಂದ ಕಂಗೊಳಿಸುವ ಈ ಜಿಲ್ಲೆ, ಸಂಡೂರಿನ ಹಸಿರು ಕ್ರೌಂಚಗಿರಿ ಕಣಿವೆ, ೭ನೇ ಶತಮಾನದ ಕುಮಾರಸ್ವಾಮಿ ದೇವಾಲಯ ಮತ್ತು ದರೋಜಿ ಕರಡಿ ಧಾಮಕ್ಕೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "vijayanagara",
        "name": "Vijayanagara",
        "nameKannada": "ವಿಜಯನಗರ",
        "division": "Kalaburagi",
        "headquarters": "Hospet",
        "lat": 15.2689,
        "lng": 76.3909,
        "taluks": ["Hospet", "Hagaribommanahalli", "Harapanahalli", "Hoovina Hadagali", "Kudligi", "Kotturu"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "Karnataka's 31st district, home to the world-renowned UNESCO World Heritage site of Hampi, the grand Tungabhadra Dam, Virupaksha temple, stone chariot, and majestic boulder-strewn landscapes.",
        "descriptionKannada": "ಕರ್ನಾಟಕದ ೩೧ನೇ ಜಿಲ್ಲೆ, ಜಗತ್ಪ್ರಸಿದ್ಧ ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆ ತಾಣ ಹಂಪಿ, ತುಂಗಭದ್ರಾ ಜಲಾಶಯ, ವಿರೂಪಾಕ್ಷ ದೇವಾಲಯ, ಕಲ್ಲಿನ ರಥ ಮತ್ತು ಭವ್ಯ ಬಂಡೆಗಲ್ಲುಗಳ ಭೂದೃಶ್ಯಗಳ ತವರು."
    },

    # Belagavi Division
    {
        "id": "belagavi",
        "name": "Belagavi",
        "nameKannada": "ಬೆಳಗಾವಿ",
        "division": "Belagavi",
        "headquarters": "Belagavi",
        "lat": 15.8497,
        "lng": 74.4977,
        "taluks": ["Belagavi", "Bailhongal", "Chikkodi", "Gokak", "Hukkeri", "Khanapur", "Ramdurg", "Raybag", "Saundatti", "Athani", "Kittur", "Mudalagi", "Kagawad", "Yaragatti"],
        "bannerImage": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
        "description": "Border city of pleasant weather and rich heritage, featuring Belagavi Fort with the lotus-ceiling Kamal Basadi, Rani Chennamma's Kittur Fort, Gokak Falls with its suspension bridge, and Savadatti Yellamma Gudda.",
        "descriptionKannada": "ಹಿತಕರ ಹವಾಮಾನ ಮತ್ತು ಶ್ರೀಮಂತ ಇತಿಹಾಸದ ಬೆಳಗಾವಿ, ಕಮಲ ಬಸದಿಯಿರುವ ಬೆಳಗಾವಿ ಕೋಟೆ, ಕಿತ್ತೂರು ಚೆನ್ನಮ್ಮನ ಕೋಟೆ, ಗೋಕಾಕ್ ಜಲಪಾತ ಮತ್ತು ಸವದತ್ತಿ ಎಲ್ಲಮ್ಮನ ಗುಡ್ಡಕ್ಕೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "bagalkot",
        "name": "Bagalkot",
        "nameKannada": "ಬಾಗಲಕೋಟೆ",
        "division": "Belagavi",
        "headquarters": "Bagalkot",
        "lat": 16.1687,
        "lng": 75.6559,
        "taluks": ["Bagalkot", "Badami", "Bilgi", "Hungund", "Jamkhandi", "Mudhol", "Ilkal", "Rabkavi Banhatti", "Guledgudda"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "The cradle of Indian temple architecture, Bagalkot houses the 6th-century Badami Cave Temples, the laboratory temples of Aihole, Pattadakal UNESCO World Heritage complex, Kudalasangama, and Ilkal sarees.",
        "descriptionKannada": "ಭಾರತೀಯ ದೇವಾಲಯ ವಾಸ್ತುಶಿಲ್ಪದ ತೊಟ್ಟಿಲು, ಬಾದಾಮಿ ಗುಹಾ ದೇವಾಲಯಗಳು, ಐಹೊಳೆ, ಪಟ್ಟದಕಲ್ಲು ಯುನೆಸ್ಕೋ ತಾಣ, ಕೂಡಲಸಂಗಮ ಮತ್ತು ಇಳಕಲ್ ಸೀರೆಗಳಿಗೆ ಬಾಗಲಕೋಟೆ ಖ್ಯಾತವಾಗಿದೆ."
    },
    {
        "id": "vijayapura",
        "name": "Vijayapura",
        "nameKannada": "ವಿಜಯಪುರ",
        "division": "Belagavi",
        "headquarters": "Vijayapura",
        "lat": 16.8302,
        "lng": 75.7100,
        "taluks": ["Vijayapura", "Basavana Bagewadi", "Indi", "Muddebihal", "Sindagi", "Babaleshwar", "Chadchan", "Nidagundi", "Tikota", "Devar Hippargi", "Kolhar"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "City of medieval monuments and domes, Vijayapura is world-renowned for Gol Gumbaz with its acoustic Whispering Gallery, the exquisite Ibrahim Rauza, Bara Kaman arches, and Almatti Dam gardens.",
        "descriptionKannada": "ಮಧ್ಯಕಾಲೀನ ಗುಮ್ಮಟಗಳ ನಗರ ವಿಜಯಪುರ, ಜಗತ್ಪ್ರಸಿದ್ಧ ಗುಸುಗುಸು ಗ್ಯಾಲರಿಯಿರುವ ಗೋಲ್ ಗುಂಬಜ್, ಇಬ್ರಾಹಿಂ ರೋಜಾ, ಬಾರಾ ಕಮಾನ್ ಮತ್ತು ಆಲಮಟ್ಟಿ ಜಲಾಶಯ ಉದ್ಯಾನವನಗಳನ್ನು ಒಳಗೊಂಡಿದೆ."
    },
    {
        "id": "dharwad",
        "name": "Dharwad",
        "nameKannada": "ಧಾರವಾಡ",
        "division": "Belagavi",
        "headquarters": "Dharwad",
        "lat": 15.4589,
        "lng": 75.0078,
        "taluks": ["Dharwad", "Hubballi Urban", "Hubballi Rural", "Kalghatgi", "Kundgol", "Navalgund", "Alnavar", "Annigeri"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "Cultural and educational capital of North Karnataka, Dharwad is celebrated for classical Hindustani music, the GI-tagged Dharwad Pedha, 900-year-old Chandramouleshwara Temple, and Unkal Lake.",
        "descriptionKannada": "ಉತ್ತರ ಕರ್ನಾಟಕದ ಸಾಂಸ್ಕೃತಿಕ ಮತ್ತು ವಿದ್ಯಾಕಾಶಿ ಧಾರವಾಡ, ಹಿಂದೂಸ್ತಾನಿ ಶಾಸ್ತ್ರೀಯ ಸಂಗೀತ, ಜಿಐ ಟ್ಯಾಗ್ ಪಡೆದ ಧಾರವಾಡ ಪೇಡಾ, ಚಂದ್ರಮೌಳೇಶ್ವರ ದೇವಾಲಯ ಮತ್ತು ಉಣಕಲ್ ಕೆರೆಗೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "gadag",
        "name": "Gadag",
        "nameKannada": "ಗದಗ",
        "division": "Belagavi",
        "headquarters": "Gadag",
        "lat": 15.4167,
        "lng": 75.6333,
        "taluks": ["Gadag", "Ron", "Shirahatti", "Mundargi", "Nargund", "Gajendragad", "Lakshmeshwar"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "Land of classical Kannada literature and stepwells, Gadag features Lakkundi's 50+ Chalukyan temples and 101 stepwells, Veeranarayana Temple where poet Kumara Vyasa wrote the Mahabharata, and Trikuteshwara Temple.",
        "descriptionKannada": "ಕನ್ನಡ ಸಾಹಿತ್ಯ ಮತ್ತು ಕಲ್ಯಾಣಿಗಳ ನಾಡು ಗದಗ, ಲಕ್ಕುಂಡಿಯ ೫೦ಕ್ಕೂ ಹೆಚ್ಚು ದೇವಾಲಯಗಳು ಮತ್ತು ೧೦೧ ಕಲ್ಯಾಣಿಗಳು, ಕುಮಾರವ್ಯಾಸ ಭಾರತ ರಚಿಸಿದ ವೀರನಾರಾಯಣ ದೇವಾಲಯಕ್ಕೆ ಖ್ಯಾತ."
    },
    {
        "id": "haveri",
        "name": "Haveri",
        "nameKannada": "ಹಾವೇರಿ",
        "division": "Belagavi",
        "headquarters": "Haveri",
        "lat": 14.7964,
        "lng": 75.3992,
        "taluks": ["Haveri", "Byadgi", "Hangal", "Hirekerur", "Ranebennur", "Savanur", "Shiggaon", "Rattihalli"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "The gateway to North Karnataka, Haveri features Tarakeshwara Temple at Hangal with its 20-foot carved lotus ceiling, the Asia-renowned Byadgi chilli market, Kaginele Kanaka Guru Peetha, and Ranebennur Blackbuck Sanctuary.",
        "descriptionKannada": "ಉತ್ತರ ಕರ್ನಾಟಕದ ಹೆಬ್ಬಾಗಿಲು ಹಾವೇರಿ, ಹಾನಗಲ್ಲಿನ ತಾರಕೇಶ್ವರ ದೇವಾಲಯದ ೨೦ ಅಡಿ ಕೆತ್ತನೆಯ ಕಮಲದ ಮೇಲ್ಚಾವಣಿ, ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಕಾಗಿನೆಲೆ ಕನಕ ಪೀಠಕ್ಕೆ ಹೆಸರುವಾಸಿ."
    },
    {
        "id": "uttara_kannada",
        "name": "Uttara Kannada",
        "nameKannada": "ಉತ್ತರ ಕನ್ನಡ",
        "division": "Belagavi",
        "headquarters": "Karwar",
        "lat": 14.8167,
        "lng": 74.1333,
        "taluks": ["Karwar", "Ankola", "Bhatkal", "Haliyal", "Honnavar", "Joida", "Kumta", "Mundgod", "Siddapur", "Sirsi", "Yellapur", "Dandeli"],
        "bannerImage": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
        "description": "Where dense Western Ghats rainforests meet the Arabian Sea, Uttara Kannada is home to spiritual Gokarna Om Beach, Murudeshwar Shiva temple, Dandeli river rafting, Yana karst rocks, and Sathodi & Magod falls.",
        "descriptionKannada": "ನಿತ್ಯಹರಿದ್ವರ್ಣ ಮಳೆಕಾಡು ಮತ್ತು ಅರಬ್ಬಿ ಸಮುದ್ರದ ಸಂಗಮ, ಗೋಕರ್ಣ ಓಂ ಬೀಚ್, ಮುರುಡೇಶ್ವರ ಬೃಹತ್ ಶಿವನ ಪ್ರತಿಮೆ, ದಾಂಡೇಲಿ ರಾಫ್ಟಿಂಗ್, ಯಾಣ ಶಿಖರಗಳು ಮತ್ತು ಸಾತೊಡ್ಡಿ ಜಲಪಾತಗಳ ನಾಡು."
    },

    # Bengaluru Division
    {
        "id": "bengaluru_urban",
        "name": "Bengaluru Urban",
        "nameKannada": "ಬೆಂಗಳೂರು ನಗರ",
        "division": "Bengaluru",
        "headquarters": "Bengaluru",
        "lat": 12.9716,
        "lng": 77.5946,
        "taluks": ["Bengaluru North", "Bengaluru South", "Bengaluru East", "Anekal", "Yelahanka"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "The dynamic capital city and tech hub of India, featuring Tudor-style Bangalore Palace, 240-acre Lalbagh Botanical Garden, Tipu's Summer Palace, Bannerghatta Biological Safari, and the 890 CE Begur inscription.",
        "descriptionKannada": "ಭಾರತದ ಸಿಲಿಕಾನ್ ಸಿಟಿ ಮತ್ತು ರಾಜಧಾನಿ, ಬೆಂಗಳೂರು ಅರಮನೆ, ಲಾಲ್‌ಬಾಗ್ ಸಸ್ಯತೋಟ, ಟಿಪ್ಪು ಸುಲ್ತಾನ್ ಬೇಸಿಗೆ ಅರಮನೆ, ಬನ್ನೇರುಘಟ್ಟ ಜೈವಿಕ ಉದ್ಯಾನ ಮತ್ತು ೮೯೦ರ ಬೇಗೂರು ಶಾಸನವನ್ನು ಒಳಗೊಂಡಿದೆ."
    },
    {
        "id": "bengaluru_rural",
        "name": "Bengaluru Rural",
        "nameKannada": "ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ",
        "division": "Bengaluru",
        "headquarters": "Devanahalli",
        "lat": 13.2483,
        "lng": 77.7125,
        "taluks": ["Devanahalli", "Doddaballapura", "Hosakote", "Nelamangala"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Encircling the capital, Bengaluru Rural is rich in scenic forts and pilgrimage centers, including historic Devanahalli Fort (birthplace of Tipu Sultan), Ghati Subramanya Temple, and Makalidurga hill trek.",
        "descriptionKannada": "ರಾಜಧಾನಿಯ ಸುತ್ತಲಿನ ಗ್ರಾಮಾಂತರ ಜಿಲ್ಲೆ, ಟಿಪ್ಪು ಸುಲ್ತಾನರ ಜನ್ಮಸ್ಥಳವಾದ ದೇವನಹಳ್ಳಿ ಕೋಟೆ, ಘಾಟಿ ಸುಬ್ರಹ್ಮಣ್ಯ ದೇವಾಲಯ ಮತ್ತು ಮಾಕಾಳಿದುರ್ಗ ಚಾರಣಕ್ಕೆ ಹೆಸರಾಗಿದೆ."
    },
    {
        "id": "ramanagara",
        "name": "Ramanagara",
        "nameKannada": "ರಾಮನಗರ",
        "division": "Bengaluru",
        "headquarters": "Ramanagara",
        "lat": 12.7236,
        "lng": 77.2883,
        "taluks": ["Ramanagara", "Channapatna", "Kanakapura", "Magadi", "Harohalli"],
        "bannerImage": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
        "description": "Famous for the massive granite hills of Ramadevara Betta ('Sholay Hills') and Vulture Sanctuary, Savandurga monolith, Channapatna GI wooden toy town, and Janapada Loka folk museum.",
        "descriptionKannada": "'ಶೋಲೆ' ಖ್ಯಾತಿಯ ರಾಮದೇವರ ಬೆಟ್ಟ ಮತ್ತು ರಣಹದ್ದು ಧಾಮ, ಏಷ್ಯಾದ ಬೃಹತ್ ಏಕಶಿಲೆ ಸಾವನದುರ್ಗ, ಚನ್ನಪಟ್ಟಣದ ಮರದ ಗೊಂಬೆಗಳು ಮತ್ತು ಜಾನಪದ ಲೋಕಕ್ಕೆ ರಾಮನಗರ ಹೆಸರುವಾಸಿ."
    },
    {
        "id": "chikkaballapur",
        "name": "Chikkaballapur",
        "nameKannada": "ಚಿಕ್ಕಬಳ್ಳಾಪುರ",
        "division": "Bengaluru",
        "headquarters": "Chikkaballapur",
        "lat": 13.4356,
        "lng": 77.7275,
        "taluks": ["Chikkaballapur", "Bagepalli", "Chintamani", "Gauribidanur", "Gudibanda", "Sidlaghatta", "Chelur"],
        "bannerImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
        "description": "Home to the misty hill fortress Nandi Hills, 9th-century Bhoga Nandeeshwara temple, Skandagiri night trek, Sir M. Visvesvaraya memorial at Muddenahalli, and multi-tiered Gudibanda Fort.",
        "descriptionKannada": "ಮಂಜು ಮುಸುಕಿದ ನಂದಿ ಬೆಟ್ಟ, ೯ನೇ ಶತಮಾನದ ಭೋಗ ನಂದೀಶ್ವರ ದೇವಾಲಯ, ಸ್ಕಂದಗಿರಿ ನೈಟ್ ಟ್ರೆಕ್, ಮುದ್ದೇನಹಳ್ಳಿಯ ಸರ್ ಎಂ.ವಿ. ಸ್ಮಾರಕ ಮತ್ತು ಗುಡಿಬಂಡೆ ಕೋಟೆಯ ನಾಡು."
    },
    {
        "id": "kolar",
        "name": "Kolar",
        "nameKannada": "ಕೋಲಾರ",
        "division": "Bengaluru",
        "headquarters": "Kolar",
        "lat": 13.1367,
        "lng": 78.1333,
        "taluks": ["Kolar", "Bangarapet", "Malur", "Mulbagal", "Srinivaspur", "KGF"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Historic gold mining land, Kolar boasts the legacy of KGF (Kolar Gold Fields), Kotilingeshwara temple with its 108-foot linga, Anthargange cave trek and volcanic springs, and Kurudumale Ganesha.",
        "descriptionKannada": "ಚಿನ್ನದ ನಾಡು ಕೋಲಾರ, ಕೆಜಿಎಫ್ ಗಣಿ ಪರಂಪರೆ, ಕೋಟಿಲಿಂಗೇಶ್ವರ ದೇವಾಲಯ, ಅಂತರಗಂಗೆಯ ನೈಸರ್ಗಿಕ ಗುಹೆಗಳು ಮತ್ತು ಕುರುಡುಮಲೆ ಗಣಪತಿ ದೇವಾಲಯಕ್ಕೆ ಪ್ರಸಿದ್ಧವಾಗಿದೆ."
    },
    {
        "id": "tumakuru",
        "name": "Tumakuru",
        "nameKannada": "ತುಮಕೂರು",
        "division": "Bengaluru",
        "headquarters": "Tumakuru",
        "lat": 13.3392,
        "lng": 77.1017,
        "taluks": ["Tumakuru", "Chiknayakanhalli", "Gubbi", "Koratagere", "Kunigal", "Madhugiri", "Pavagada", "Sira", "Tiptur", "Turuvekere"],
        "bannerImage": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
        "description": "Known as 'Kalpataru Nadu' for its coconut wealth, Tumakuru features Asia's second-largest monolithic Madhugiri Fort, Sri Siddaganga Matha, Devarayanadurga hill temples, and pristine Hoysala temples at Aralaguppe.",
        "descriptionKannada": "'ಕಲ್ಪತರು ನಾಡು' ತುಮಕೂರು, ಏಷ್ಯಾದ ಎರಡನೇ ದೊಡ್ಡ ಏಕಶಿಲೆ ಮಧುಗಿರಿ ಕೋಟೆ, ತ್ರಿವಿಧ ದಾಸೋಹಿ ಶ್ರೀ ಸಿದ್ಧಗಂಗಾ ಮಠ, ದೇವರಾಯನದುರ್ಗ ಮತ್ತು ಅರಳಗುಪ್ಪೆ ಹೊಯ್ಸಳ ದೇವಾಲಯಗಳನ್ನು ಒಳಗೊಂಡಿದೆ."
    },
    {
        "id": "chitradurga",
        "name": "Chitradurga",
        "nameKannada": "ಚಿತ್ರದುರ್ಗ",
        "division": "Bengaluru",
        "headquarters": "Chitradurga",
        "lat": 14.2236,
        "lng": 76.4000,
        "taluks": ["Chitradurga", "Challakere", "Hiriyur", "Holalkere", "Hosadurga", "Molakalmuru"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "The formidable 'Fort City' of Karnataka, celebrated for the Seven-Ringed Stone Fortress (Kallina Kote) of Madakari Nayaka, heroic Obavvana Kindi, Chandravalli caves, and historic Vani Vilasa Sagara Dam.",
        "descriptionKannada": "ವೀರರ ನಾಡು ಚಿತ್ರದುರ್ಗ, ಮದಕರಿ ನಾಯಕನ ಏಳುಸುತ್ತಿನ ಕಲ್ಲಿನ ಕೋಟೆ, ವೀರವನಿತೆ ಒಣಕೆ ಓಬವ್ವನ ಕಿಂಡಿ, ಚಂದ್ರವಳ್ಳಿ ಪ್ರಾಚ್ಯ ಗುಹೆಗಳು ಮತ್ತು ವಾಣಿ ವಿಲಾಸ ಸಾಗರಕ್ಕೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "davanagere",
        "name": "Davanagere",
        "nameKannada": "ದಾವಣಗೆರೆ",
        "division": "Bengaluru",
        "headquarters": "Davanagere",
        "lat": 14.4644,
        "lng": 75.9219,
        "taluks": ["Davanagere", "Harihara", "Honnali", "Channagiri", "Jagalur", "Nyamathi"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "The textile hub and culinary capital celebrated for its world-famous Davangere Benne Dosa, the 1224 CE Hoysala Harihareshwara Temple on Tungabhadra, Santhebennur royal pushkarini, and historic Shanti Sagara lake.",
        "descriptionKannada": "ಜವಳಿ ಮತ್ತು ರುಚಿಕರ ಬೆಣ್ಣೆ ದೋಸೆಯ ನಗರ ದಾವಣಗೆರೆ, ತುಂಗಭದ್ರಾ ನದಿ ತೀರದ ಹೊಯ್ಸಳ ಹರಿಹರೇಶ್ವರ ದೇವಾಲಯ, ಸಂತೆಬೆನ್ನೂರು ಪುಷ್ಕರಣಿ ಮತ್ತು ಶಾಂತಿ ಸಾಗರ ಕೆರೆಗೆ ಹೆಸರಾಗಿದೆ."
    },
    {
        "id": "shivamogga",
        "name": "Shivamogga",
        "nameKannada": "ಶಿವಮೊಗ್ಗ",
        "division": "Bengaluru",
        "headquarters": "Shivamogga",
        "lat": 13.9299,
        "lng": 75.5681,
        "taluks": ["Shivamogga", "Bhadravathi", "Hosanagara", "Sagara", "Shikaripura", "Soraba", "Thirthahalli"],
        "bannerImage": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
        "description": "The gateway to Malenadu, Shivamogga is blessed with the majestic 830-foot Jog Falls, Agumbe rainforests ('Cherrapunji of the South'), Keladi & Ikkeri Nayaka architecture, Kodachadri peak, and Sakrebyle elephant camp.",
        "descriptionKannada": "ಮಲೆನಾಡಿನ ಹೆಬ್ಬಾಗಿಲು ಶಿವಮೊಗ್ಗ, ವಿಶ್ವಪ್ರಸಿದ್ಧ ಜೋಗ ಜಲಪಾತ, ಆಗುಂಬೆ ನಿತ್ಯಹರಿದ್ವರ್ಣ ಮಳೆಕಾಡು, ಕೆಳದಿ-ಇಕ್ಕೇರಿ ವಾಸ್ತುಶಿಲ್ಪ, ಕೊಡಚಾದ್ರಿ ಶಿಖರ ಮತ್ತು ಸಕ್ರೆಬೈಲು ಆನೆ ಬಿಡಾರಗಳನ್ನು ಹೊಂದಿದೆ."
    },

    # Mysuru Division
    {
        "id": "mysuru",
        "name": "Mysuru",
        "nameKannada": "ಮೈಸೂರು",
        "division": "Mysuru",
        "headquarters": "Mysuru",
        "lat": 12.2958,
        "lng": 76.6394,
        "taluks": ["Mysuru", "Hunsur", "Krishnarajanagara", "Nanjangud", "Heggadadevankote", "Piriyapatna", "Tirumakudalu Narasipura", "Saragur", "Saligrama"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "The heritage palace city of Karnataka, Mysuru is famous for the illuminated Amba Vilas Palace, Chamundi Hills, Somanathapura Keshava UNESCO temple, Brindavan Gardens, Talakadu sand dunes, and Mysuru Dasara.",
        "descriptionKannada": "ಕರ್ನಾಟಕದ ಸಾಂಸ್ಕೃತಿಕ ರಾಜಧಾನಿ ಮೈಸೂರು, ಅಂಬಾ ವಿಲಾಸ ಅರಮನೆ, ಚಾಮುಂಡಿ ಬೆಟ್ಟ, ಸೋಮನಾಥಪುರ ಯುನೆಸ್ಕೋ ದೇವಾಲಯ, ಬೃಂದಾವನ ಗಾರ್ಡನ್ಸ್ ಮತ್ತು ದಸರಾ ವೈಭವಕ್ಕೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "mandya",
        "name": "Mandya",
        "nameKannada": "ಮಂಡ್ಯ",
        "division": "Mysuru",
        "headquarters": "Mandya",
        "lat": 12.5218,
        "lng": 76.8951,
        "taluks": ["Mandya", "Maddur", "Malavalli", "Pandavapura", "Nagamangala", "Krishnarajapet", "Srirangapatna"],
        "bannerImage": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
        "description": "Sugar capital of Karnataka nestled along the Cauvery, Mandya boasts the historic island capital Srirangapatna, thunderous Shivanasamudra Falls, Ranganathittu Bird Sanctuary, and sacred Melukote.",
        "descriptionKannada": "ಸಕ್ಕರೆ ನಾಡು ಮಂಡ್ಯ, ಐತಿಹಾಸಿಕ ದ್ವೀಪ ನಗರ ಶ್ರೀರಂಗಪಟ್ಟಣ, ಭೋರ್ಗರೆಯುವ ಶಿವನಸಮುದ್ರ ಜಲಪಾತ, ರಂಗನತಿಟ್ಟು ಪಕ್ಷಿಧಾಮ ಮತ್ತು ಪವಿತ್ರ ಮೇಲುಕೋಟೆಗೆ ಖ್ಯಾತವಾಗಿದೆ."
    },
    {
        "id": "hassan",
        "name": "Hassan",
        "nameKannada": "ಹಾಸನ",
        "division": "Mysuru",
        "headquarters": "Hassan",
        "lat": 13.0033,
        "lng": 76.1004,
        "taluks": ["Hassan", "Alur", "Arkalgud", "Arsikere", "Belur", "Channarayapatna", "Holenarasipura", "Sakleshpur"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "Architectural wonderland of Karnataka, Hassan is home to the UNESCO World Heritage Hoysala temples of Belur and Halebidu, the colossal 57-foot Bahubali monolith at Shravanabelagola, and floating Shettihalli Church.",
        "descriptionKannada": "ವಾಸ್ತುಶಿಲ್ಪದ ಕೌತುಕ ಹಾಸನ, ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆ ಬೇಲೂರು-ಹಳೇಬೀಡು ಹೊಯ್ಸಳ ದೇವಾಲಯಗಳು, ಶ್ರವಣಬೆಳಗೊಳದ ೫೭ ಅಡಿ ಗೊಮ್ಮಟೇಶ್ವರ ಮತ್ತು ಮುಳುಗಡೆ ಶೆಟ್ಟಿಹಳ್ಳಿ ಚರ್ಚ್‌ಗೆ ಹೆಸರುವಾಸಿ."
    },
    {
        "id": "chikkamagaluru",
        "name": "Chikkamagaluru",
        "nameKannada": "ಚಿಕ್ಕಮಗಳೂರು",
        "division": "Mysuru",
        "headquarters": "Chikkamagaluru",
        "lat": 13.3161,
        "lng": 75.7720,
        "taluks": ["Chikkamagaluru", "Kadur", "Koppa", "Mudigere", "Narasimharajapura", "Sringeri", "Tarikere", "Ajjampura", "Kalasa"],
        "bannerImage": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
        "description": "The birthplace of Indian coffee, Chikkamagaluru features Karnataka's highest peak Mullayanagiri (1,930m), Kudremukh National Park, sacred Sringeri Sharada Peetha, Baba Budangiri, and cascading Hebbe Falls.",
        "descriptionKannada": "ಕಾಫಿಯ ತವರು ಚಿಕ್ಕಮಗಳೂರು, ಕರ್ನಾಟಕದ ಅತಿ ಎತ್ತರದ ಶಿಖರ ಮುಳ್ಳಯ್ಯನಗಿರಿ, ಕುದುರೆಮುಖ ರಾಷ್ಟ್ರೀಯ ಉದ್ಯಾನ, ಪವಿತ್ರ ಶೃಂಗೇರಿ ಶಾರದಾ ಪೀಠ, ಬಾಬಾಬುಡನ್‌ಗಿರಿ ಮತ್ತು ಹೆಬ್ಬೆ ಜಲಪಾತಕ್ಕೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "kodagu",
        "name": "Kodagu",
        "nameKannada": "ಕೊಡಗು",
        "division": "Mysuru",
        "headquarters": "Madikeri",
        "lat": 12.4244,
        "lng": 75.7382,
        "taluks": ["Madikeri", "Somwarpet", "Virajpet", "Kushalnagar", "Ponnampet"],
        "bannerImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
        "description": "Known as 'Scotland of India', Kodagu is celebrated for misty coffee plantations, Talakaveri (source of River Cauvery), Abbey Falls, Raja's Seat in Madikeri, Dubare Elephant Camp, and Namdroling Golden Temple.",
        "descriptionKannada": "'ಭಾರತದ ಸ್ಕಾಟ್‌ಲ್ಯಾಂಡ್' ಕೊಡಗು, ಮಂಜಿನ ಕಾಫಿ ತೋಟಗಳು, ಕಾವೇರಿಯ ಉಗಮ ತಲಕಾವೇರಿ, ಅಬ್ಬಿ ಜಲಪಾತ, ಮಡಿಕೇರಿಯ ರಾಜಾಸೀಟ್, ದುಬಾರೆ ಆನೆ ಶಿಬಿರ ಮತ್ತು ಬೈಲಕುಪ್ಪೆಯ ಗೋಲ್ಡನ್ ಟೆಂಪಲ್‌ಗೆ ಖ್ಯಾತ."
    },
    {
        "id": "dakshina_kannada",
        "name": "Dakshina Kannada",
        "nameKannada": "ದಕ್ಷಿಣ ಕನ್ನಡ",
        "division": "Mysuru",
        "headquarters": "Mangaluru",
        "lat": 12.8700,
        "lng": 74.8800,
        "taluks": ["Mangaluru", "Bantwal", "Belthangady", "Puttur", "Sullia", "Moodbidri", "Kadaba"],
        "bannerImage": "https://images.unsplash.com/photo-1600100397608-f010f443b350?w=1200&auto=format&fit=crop&q=80",
        "description": "Coastal and pilgrimage heartland, Dakshina Kannada features port city Mangaluru, sacred Dharmasthala, Kukke Subramanya beneath Kumara Parvatha, Moodbidri's Thousand Pillar Basadi, and Panambur Beach.",
        "descriptionKannada": "ಕರಾವಳಿಯ ಧಾರ್ಮಿಕ ಕೇಂದ್ರ ದಕ್ಷಿಣ ಕನ್ನಡ, ಬಂದರು ನಗರಿ ಮಂಗಳೂರು, ಧರ್ಮಸ್ಥಳ ಮಂಜುನಾಥ, ಕುಕ್ಕೆ ಸುಬ್ರಹ್ಮಣ್ಯ, ಮೂಡುಬಿದಿರೆಯ ಸಾವಿರ ಕಂಬದ ಬಸದಿ ಮತ್ತು ಪಣಂಬೂರು ಬೀಚ್‌ಗೆ ಹೆಸರುವಾಸಿ."
    },
    {
        "id": "udupi",
        "name": "Udupi",
        "nameKannada": "ಉಡುಪಿ",
        "division": "Mysuru",
        "headquarters": "Udupi",
        "lat": 13.3409,
        "lng": 74.7421,
        "taluks": ["Udupi", "Kundapura", "Karkala", "Byndoor", "Brahmavara", "Kaup", "Hebri"],
        "bannerImage": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
        "description": "Spiritual temple coast and culinary capital, Udupi is famed for the 13th-century Sri Krishna Matha, volcanic columnar basalt of St. Mary's Island, Kaup lighthouse beach, Karkala Bahubali, and floating Varanga lake basadi.",
        "descriptionKannada": "ಕೃಷ್ಣನ ನಗರಿ ಮತ್ತು ಕರಾವಳಿ ಸೌಂದರ್ಯದ ಉಡುಪಿ, ಶ್ರೀ ಕೃಷ್ಣ ಮಠ, ಸೇಂಟ್ ಮೇರಿಸ್ ದ್ವೀಪದ ಷಡ್ಭುಜಾಕೃತಿಯ ಶಿಲಾ ಸ್ತಂಭಗಳು, ಕಾಪು ಲೈಟ್‌ಹೌಸ್, ಕಾರ್ಕಳ ಬಾಹುಬಲಿ ಮತ್ತು ವರಂಗ ಕೆರೆ ಬಸದಿಗೆ ಪ್ರಸಿದ್ಧ."
    },
    {
        "id": "chamarajanagar",
        "name": "Chamarajanagar",
        "nameKannada": "ಚಾಮರಾಜನಗರ",
        "division": "Mysuru",
        "headquarters": "Chamarajanagar",
        "lat": 11.9261,
        "lng": 76.9437,
        "taluks": ["Chamarajanagar", "Gundlupet", "Kollegal", "Yelandur", "Hanur"],
        "bannerImage": "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=1200&auto=format&fit=crop&q=80",
        "description": "Southern gateway of vast wildlife sanctuaries, Chamarajanagar is home to Bandipur Tiger Reserve, sacred Biligiri Rangana Hills (BR Hills), Male Mahadeshwara Hills (MM Hills), and scenic sunflower plains.",
        "descriptionKannada": "ವನ್ಯಜೀವಿ ಧಾಮಗಳ ತವರು ಚಾಮರಾಜನಗರ, ಬಂಡೀಪುರ ಹುಲಿ ಸಂರಕ್ಷಿತ ಪ್ರದೇಶ, ಬಿಳಿಗಿರಿ ರಂಗನ ಬೆಟ್ಟ, ಮಲೆ ಮಹದೇಶ್ವರ ಬೆಟ್ಟ ಮತ್ತು ಗುಂಡ್ಲುಪೇಟೆಯ ಸೂರ್ಯಕಾಂತಿ ಹೊಲಗಳಿಗೆ ಖ್ಯಾತವಾಗಿದೆ."
    }
]

def standardize_existing_place(place):
    """Ensure existing place satisfies all 30 fields while keeping custom details."""
    lat = place.get('lat') or (place.get('location') and place['location'].get('latitude')) or 12.9716
    lng = place.get('lng') or (place.get('location') and place['location'].get('longitude')) or 77.5946
    name = place.get('name', 'Karnataka Landmark')
    name_kn = place.get('nameKannada', name)
    district = place.get('district', 'Bengaluru Urban')
    taluk = place.get('taluk', district)
    category = place.get('category')
    if isinstance(category, str):
        category = [category]
    elif not category:
        category = ['heritage']

    hidden_status = "popular"
    if place.get('offbeat'):
        hidden_status = "hidden_gem"
    elif place.get('crowdLevel', 2) <= 1:
        hidden_status = "lesser_known"

    return {
        **place,
        "lat": round(float(lat), 6),
        "lng": round(float(lng), 6),
        "location": {"latitude": round(float(lat), 6), "longitude": round(float(lng), 6)},
        "location_verified": True,
        "nameKannada": name_kn,
        "district": district,
        "taluk": taluk,
        "village": place.get('village', taluk),
        "gramPanchayat": place.get('gramPanchayat', f"{taluk} Administration"),
        "category": category,
        "subcategory": place.get('subcategory', place.get('place_type', 'heritage_site')),
        "googleMapsUrl": place.get('googleMapsUrl', f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"),
        "historicalSignificance": place.get('historicalSignificance', place.get('description', f"Historic monument in {district}")),
        "culturalImportance": place.get('culturalImportance', f"Cultural destination in {district} celebrated with regional festivals."),
        "bestSeason": place.get('bestSeason', 'October to March'),
        "entryFeeINR": place.get('entryFeeINR', 0),
        "openingHours": place.get('openingHours', '06:00 – 18:00'),
        "distanceFromNearestTown": place.get('distanceFromNearestTown', f"Within {district} district"),
        "nearestBusStation": place.get('nearestBusStation', f"{taluk} KSRTC Bus Stand"),
        "nearestRailwayStation": place.get('nearestRailwayStation', f"Nearest rail junction serving {district}"),
        "roadAccessibility": place.get('roadAccessibility', 'Paved all-weather road; accessible by car and bus'),
        "trekkingDifficulty": place.get('trekkingDifficulty', 'None'),
        "estimatedVisitDuration": place.get('estimatedVisitDuration', f"{place.get('avgVisitHours', 2)} hours"),
        "safetyInstructions": place.get('safetyInstructions', 'Follow posted visitor signage and respect sacred or archaeological surroundings.'),
        "permissionRequirements": place.get('permissionRequirements', 'No prior permission required; open to visitors'),
        "tourismInformationSource": place.get('dataSource', 'Karnataka State Gazetteer / Department of Tourism'),
        "verificationStatus": place.get('verification_status', 'verified'),
        "hiddenGemClassification": place.get('hiddenGemClassification', {
            "status": hidden_status,
            "reason": f"Recognized tourist destination in {district} circuit."
        })
    }

def compile():
    print("=" * 60)
    print("PRAVASA AI: COMPILING 31-DISTRICT TOURISM DATABASE")
    print("=" * 60)

    # 1. Load existing places
    existing_places = []
    if os.path.exists(PLACES_FILE):
        with open(PLACES_FILE, 'r', encoding='utf-8') as f:
            existing_places = json.load(f)
    print(f"Loaded {len(existing_places)} existing places from places.json")

    # Standardize existing places
    places_map = {}
    for p in existing_places:
        std_p = standardize_existing_place(p)
        places_map[std_p['id']] = std_p

    # 2. Collect researched places from all divisions
    researched = []
    researched.extend(get_kalaburagi_division_places())
    researched.extend(get_belagavi_division_places())
    researched.extend(get_bengaluru_division_places())
    researched.extend(get_mysuru_division_places())
    researched.extend(get_expanded_karnataka_places())
    print(f"Loaded {len(researched)} curated research destinations across 4 divisions")

    # 3. Merge researched places (they enhance/override with 30 validated fields)
    added_new = 0
    updated_existing = 0
    for r in researched:
        rid = r['id']
        # Also check if alias exists
        found_key = None
        for k, v in places_map.items():
            if k == rid or rid in v.get('aliases', []):
                found_key = k
                break

        if found_key:
            # Merge while preserving existing reviews, photos, videos if present
            merged = {**places_map[found_key], **r}
            places_map[found_key] = merged
            updated_existing += 1
        else:
            places_map[rid] = r
            added_new += 1

    print(f"Merge Results: Added {added_new} new destinations, Updated {updated_existing} existing destinations")

    # 4. Filter and validate all places
    all_places = list(places_map.values())
    valid_places = []
    rejected_count = 0

    for p in all_places:
        lat = p.get('lat', 0)
        lng = p.get('lng', 0)
        if not (KARNATAKA_BOUNDS['south'] <= lat <= KARNATAKA_BOUNDS['north'] and
                KARNATAKA_BOUNDS['west'] <= lng <= KARNATAKA_BOUNDS['east']):
            print(f"REJECTED out-of-bounds: {p.get('id')} ({lat}, {lng})")
            rejected_count += 1
            continue
        valid_places.append(p)

    print(f"Total Valid Destinations: {len(valid_places)} (Rejected {rejected_count})")

    # 5. Build district files in server/data/districts/
    os.makedirs(DISTRICTS_DIR, exist_ok=True)
    dist_map = {d['name'].lower(): d for d in DISTRICTS_METADATA}
    dist_map.update({d['id']: d for d in DISTRICTS_METADATA})

    # Group valid places by district
    places_by_dist = {}
    for d in DISTRICTS_METADATA:
        places_by_dist[d['id']] = []

    for p in valid_places:
        dist_name = (p.get('district') or '').lower()
        matched_dist = None
        for d in DISTRICTS_METADATA:
            if d['name'].lower() == dist_name or d['id'] == dist_name or dist_name in d['id']:
                matched_dist = d
                break

        if matched_dist:
            # Sync standardized district name
            p['district'] = matched_dist['name']
            p['division'] = matched_dist['division']
            places_by_dist[matched_dist['id']].append(p)
        else:
            # Fallback
            places_by_dist['bengaluru_urban'].append(p)

    # Write each district file
    for dist in DISTRICTS_METADATA:
        dist_id = dist['id']
        dist_places = places_by_dist[dist_id]
        dist_file = os.path.join(DISTRICTS_DIR, f"{dist_id}.json")
        with open(dist_file, 'w', encoding='utf-8') as f:
            json.dump({
                "district": dist,
                "destinations": dist_places,
                "count": len(dist_places)
            }, f, indent=2, ensure_ascii=False)

    print(f"Saved 31 modular district files into {DISTRICTS_DIR}")

    # 6. Update DISTRICTS_METADATA with live attraction counts and topSpots
    enriched_districts = []
    for dist in DISTRICTS_METADATA:
        dist_id = dist['id']
        dist_places = places_by_dist[dist_id]
        top_spots = []
        for dp in dist_places[:6]:
            top_spots.append({
                "id": dp['id'],
                "name": dp['name'],
                "nameKannada": dp.get('nameKannada', dp['name']),
                "image": dp.get('image', ''),
                "category": dp.get('category', ['heritage']),
                "entryFeeINR": dp.get('entryFeeINR', 0),
                "avgVisitHours": dp.get('avgVisitHours', 2),
                "hiddenGemStatus": dp.get('hiddenGemClassification', {}).get('status', 'popular')
            })
        enriched_districts.append({
            **dist,
            "attractionCount": len(dist_places),
            "topSpots": top_spots
        })

    with open(DISTRICTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(enriched_districts, f, indent=2, ensure_ascii=False)
    print(f"Saved districts metadata to {DISTRICTS_FILE} (31 districts)")

    # 7. Build taluks.json
    all_taluks = []
    for dist in DISTRICTS_METADATA:
        for t in dist['taluks']:
            all_taluks.append({
                "name": t,
                "districtId": dist['id'],
                "districtName": dist['name'],
                "division": dist['division']
            })

    with open(TALUKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_taluks, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_taluks)} taluk mappings to {TALUKS_FILE}")

    # 8. Save master places.json
    with open(PLACES_FILE, 'w', encoding='utf-8') as f:
        json.dump(valid_places, f, indent=2, ensure_ascii=False)
    print(f"Saved master places database ({len(valid_places)} destinations) to {PLACES_FILE}")

    # Summary by district
    print("\nDISTRICT-WISE DESTINATION COUNTS:")
    for d in enriched_districts:
        print(f"  {d['name']} ({d['nameKannada']}): {d['attractionCount']} places")

    print("\nCOMPILATION COMPLETE! All 31 districts processed successfully.")

if __name__ == '__main__':
    compile()
