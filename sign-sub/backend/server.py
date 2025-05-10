from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from React (different port)

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "Backend is connected!"})

if __name__ == "__main__":
    app.run(debug=True)
