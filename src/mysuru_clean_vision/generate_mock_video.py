import os
import cv2
import numpy as np

def generate_video():
    output_dir = os.path.expanduser('~/mysuru_ws/src/mysuru_clean_vision/data')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'sample_night_drive.mp4')

    width, height = 640, 480
    fps = 30
    duration_sec = 15
    total_frames = fps * duration_sec

    # Define video writer (mp4v codec)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Pre-compute vignette mask
    X_kernel = cv2.getGaussianKernel(width, width * 0.4)
    Y_kernel = cv2.getGaussianKernel(height, height * 0.4)
    kernel = Y_kernel * X_kernel.T
    vignette_mask = kernel / kernel.max()

    print(f"Generating synthetic night dashcam video: {output_path}")

    for frame_idx in range(total_frames):
        current_sec = frame_idx / fps

        # Base dark road image (low contrast dark gray background with road lines)
        frame = np.full((height, width, 3), 20, dtype=np.uint8)

        # Draw road lane boundaries (dim asphalt/lane markings)
        cv2.line(frame, (100, height), (260, 200), (40, 40, 40), 3)
        cv2.line(frame, (540, height), (380, 200), (40, 40, 40), 3)

        # Dashboard / street headlight glow center
        cv2.circle(frame, (width // 2, height // 2 + 50), 120, (45, 45, 40), -1)

        # Debris blocks appearing between seconds 3 and 12
        if 3.0 <= current_sec <= 12.0:
            # Draw concrete debris blocks on the road lane
            # Main debris block
            cv2.rectangle(frame, (250, 310), (390, 390), (60, 65, 70), -1)
            cv2.rectangle(frame, (250, 310), (390, 390), (80, 85, 90), 2)
            # Smaller secondary block
            cv2.rectangle(frame, (400, 340), (460, 385), (50, 55, 60), -1)
            cv2.rectangle(frame, (400, 340), (460, 385), (75, 80, 85), 2)

        # Apply low contrast reduction (darken background)
        frame = (frame.astype(np.float32) * 0.6).astype(np.uint8)

        # Apply heavy vignette
        for c in range(3):
            frame[:, :, c] = (frame[:, :, c] * vignette_mask).astype(np.uint8)

        # Add camera sensor noise
        noise = np.random.normal(0, 8, (height, width, 3)).astype(np.int16)
        frame_noisy = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        out.write(frame_noisy)

    out.release()
    print("Video generation complete.")

if __name__ == '__main__':
    generate_video()
