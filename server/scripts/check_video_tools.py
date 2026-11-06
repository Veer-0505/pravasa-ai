import sys

for pkg in ['cv2', 'imageio', 'moviepy', 'PIL', 'matplotlib', 'av']:
    try:
        __import__(pkg)
        print(f"{pkg}: available")
    except ImportError:
        print(f"{pkg}: NOT available")

