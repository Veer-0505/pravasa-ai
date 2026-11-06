import cv2
import os

video_path = r"c:\Users\veerr\Videos\Screen Recordings\Screen Recording 2026-11-05 180444.mp4"
output_dir = r"C:\Users\veerr\.gemini\antigravity\brain\5f42821c-6b7b-476d-b78a-610394f404cd\scratch\video_frames"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print(f"Error: Could not open {video_path}")
    exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps if fps > 0 else 0
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print(f"Video Info:")
print(f"  Duration: {duration:.2f} seconds ({total_frames} frames @ {fps:.2f} fps)")
print(f"  Resolution: {width}x{height}")

# Sample 1 frame every 2-3 seconds, or around 20-30 evenly spaced frames
num_samples = min(25, int(duration)) if duration > 0 else 10
step = total_frames // num_samples if num_samples > 0 else 1

frame_indices = [i * step for i in range(num_samples)]
saved_count = 0

for idx in frame_indices:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if ret:
        sec = idx / fps if fps > 0 else 0
        filename = os.path.join(output_dir, f"frame_{saved_count:02d}_{int(sec)}s.jpg")
        # Resize slightly if very huge to save space
        if width > 1280:
            scale = 1280 / width
            frame = cv2.resize(frame, (1280, int(height * scale)))
        cv2.imwrite(filename, frame)
        saved_count += 1

cap.release()
print(f"Saved {saved_count} frames to {output_dir}")

