import cv2
import mediapipe as mp

# Setup MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Setup MediaPipe Drawing
mp_drawing = mp.solutions.drawing_utils

# Start webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Cannot open camera")
    exit()

print("Starting webcam. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Flip the frame horizontally for a later selfie-view display
    frame = cv2.flip(frame, 1)

    # Convert the frame to RGB (MediaPipe requires RGB)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the frame and get hand landmarks
    results = hands.process(rgb_frame)

    # If hands are detected, draw landmarks and print them
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Print landmarks coordinates to console
            print("Landmarks for a hand:")
            for id, landmark in enumerate(hand_landmarks.landmark):
                print(f"Landmark {id}: x={landmark.x}, y={landmark.y}, z={landmark.z}")

            # Draw hand landmarks on the frame
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    # Display the frame with hand landmarks
    cv2.imshow('Hand Gesture Detection', frame)

    # Exit on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam and close all OpenCV windows
cap.release()
cv2.destroyAllWindows()
