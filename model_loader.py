from keras.models import model_from_json
from keras.models import Sequential
from tensorflow.keras.utils import get_custom_objects

# Register Sequential as a custom object (if needed for your model)
get_custom_objects()["Sequential"] = Sequential

def load_model_from_files():
    try:
        with open("model_new.json", "r") as json_file:
            model_json = json_file.read()
            print("Model architecture JSON read successfully.")
            model = model_from_json(model_json)

        model.load_weights("model_new.h5")
        print("Model weights loaded successfully.")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None
