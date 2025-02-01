from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Retrieve the API key from the environment variables
api_key = os.getenv("GENAI_API_KEY")

# Check if the API key is set
if not api_key:
    raise ValueError("API key is missing. Please set GENAI_API_KEY in the .env file.")

# Configure Google Generative AI with the API key
genai.configure(api_key=api_key)

# Initialize the model
model = genai.GenerativeModel("gemini-1.5-flash")


@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    # Generate content using the Gemini model
    try:
        response = model.generate_content(user_message)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)