import streamlit as st
import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
from model_loader import load_model_from_files

# === Load model ===
model = load_model_from_files()
if model is None:
    st.error("Model loading failed. Check model files.")
    st.stop()

class_labels = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
    "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "DELETE", "SPACE", "NOTHING"
]

# === Setup ===
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands_detector = mp_hands.Hands(min_detection_confidence=0.5, max_num_hands=2)

st.title("SignSub - Sign Language Recognition")
run = st.toggle("Start Detection", value=False)
FRAME_WINDOW = st.image([])
prediction_text = st.empty()

cap = cv2.VideoCapture(0)

last_prediction = ""

while run:
    ret, frame = cap.read()
    if not ret:
        st.error("Failed to access webcam")
        break

    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands_detector.process(frame_rgb)

    new_prediction = None

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame_rgb, hand_landmarks, mp_hands.HAND_CONNECTIONS)

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

                if confidence > 0.6:
                    new_prediction = f"{predicted_label} ({confidence:.2f})"
            except Exception as e:
                pass

    # Update displayed prediction if we got a new one
    if new_prediction:
        last_prediction = new_prediction
        prediction_text.subheader(f"Detected: {last_prediction}")

    FRAME_WINDOW.image(frame_rgb)

cap.release()
