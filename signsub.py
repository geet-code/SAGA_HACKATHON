import tkinter as tk
import cv2
import mediapipe as mp
from PIL import Image, ImageTk
import numpy as np
from model_loader import load_model_from_files  # Import the model loading function

# === Load model ===
model = load_model_from_files()
if model is None:
    print("Exiting program due to model loading failure.")
    exit(1)

# Update class_labels to match the model's output classes
class_labels = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", 
    "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z","DELETE", "SPACE",
    "NOTHING"
]

print("Model output shape:", model.output_shape)  # Debugging: Check output shape
print("Number of class labels:", len(class_labels))

# === MediaPipe Setup ===
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands_detector = mp_hands.Hands(min_detection_confidence=0.5, max_num_hands=2)

# === OpenCV Setup ===
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Camera not accessible. Please check if the camera is connected or in use.")
    exit(1)
else:
    print("Camera initialized successfully.")

detecting = False

def update_frame():
    global detecting

    ret, frame = cap.read()
    if not ret:
        print("Failed to capture image from camera.")
        return

    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    output_text = "Output: "

    if detecting:
        results = hands_detector.process(frame_rgb)
        if results.multi_hand_landmarks:
            all_predictions = []

            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame_rgb, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # === Extract bounding box around hand ===
                x_min = y_min = 1
                x_max = y_max = 0
                for lm in hand_landmarks.landmark:
                    x_min = min(x_min, lm.x)
                    x_max = max(x_max, lm.x)
                    y_min = min(y_min, lm.y)
                    y_max = max(y_max, lm.y)

                h, w, _ = frame.shape
                x1, y1 = int(x_min * w) - 20, int(y_min * h) - 20
                x2, y2 = int(x_max * w) + 20, int(y_max * h) + 20

                x1, y1 = max(x1, 0), max(y1, 0)
                x2, y2 = min(x2, w), min(y2, h)

                hand_img = frame[y1:y2, x1:x2]

                try:
                    gray = cv2.cvtColor(hand_img, cv2.COLOR_BGR2GRAY)
                    resized = cv2.resize(gray, (128, 128))
                    normalized = resized / 255.0
                    input_img = normalized.reshape(1, 128, 128, 1)

                    prediction = model.predict(input_img, verbose=0)
                    predicted_label = class_labels[np.argmax(prediction)]
                    confidence = np.max(prediction)
                    if confidence > 0.5:  # Adjust threshold as needed
                        all_predictions.append(f"{predicted_label} ({confidence:.2f})")
                    else:
                        all_predictions.append("Low confidence")
                except Exception as e:
                    print("Prediction error:", e)
                    all_predictions.append("Error")

            output_text += " | ".join(all_predictions)
        else:
            output_text += "No hand detected"
    else:
        output_text += "(Paused)"

    output_label.config(text=output_text)

    img = Image.fromarray(frame_rgb)
    imgtk = ImageTk.PhotoImage(image=img)

    video_label.config(image=imgtk)
    video_label.image = imgtk

    window.after(10, update_frame)

def toggle_detection():
    global detecting
    detecting = not detecting
    toggle_button.config(text="Stop Detection" if detecting else "Start Detection")

# === Tkinter GUI ===
window = tk.Tk()
window.title("Hand Gesture Recognition")

video_label = tk.Label(window)
video_label.pack()

toggle_button = tk.Button(window, text="Start Detection", command=toggle_detection, font=("Arial", 12))
toggle_button.pack(pady=10)

output_label = tk.Label(window, text="Output: ", font=("Arial", 14), fg="blue")
output_label.pack()

update_frame()
window.mainloop()

cap.release()
