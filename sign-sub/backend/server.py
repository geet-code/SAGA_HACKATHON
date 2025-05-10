# backend/server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import model_from_json
from tensorflow.keras import Sequential
from tensorflow.keras.layers import (
    InputLayer, Conv2D, MaxPooling2D, Flatten,
    Dense, Dropout
)
from PIL import Image
import io, base64

app = Flask(__name__)
# Allow all origins to access every route
CORS(app, resources={r"/*": {"origins": "*"}})

# 1. Load JSON architecture
with open('model_new.json', 'r') as f:
    model_json = f.read()

# 2. Rebuild model, telling Keras how to resolve each layer class
model = model_from_json(
    model_json,
    custom_objects={
        'Sequential': Sequential,
        'InputLayer': InputLayer,
        'Conv2D': Conv2D,
        'MaxPooling2D': MaxPooling2D,
        'Flatten': Flatten,
        'Dense': Dense,
        'Dropout': Dropout
    }
)

# 3. Load weights
model.load_weights('model_new.h5')

# Prediction endpoint
@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Extract base64 string
        data = request.json["image"].split(',')[1]
        # Decode & preprocess
        img = Image.open(io.BytesIO(base64.b64decode(data))) \
                  .convert('L') \
                  .resize((128, 128))  # match your model's input
        x = np.expand_dims(np.array(img)[:, :, np.newaxis] / 255.0, axis=0)
        # Predict
        preds = model.predict(x)
        cls = int(np.argmax(preds))
        return jsonify({"class": cls})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "Flask backend is live!"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
