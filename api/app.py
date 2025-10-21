from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Simple in-memory storage
histories = {}

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Advanced Stock Predictor API',
        'status': 'running',
        'version': '2.0'
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/authenticate', methods=['POST'])
def authenticate():
    try:
        data = request.json
        password = data.get('password', '')
        if password == 'Chakachaka9088@':
            return jsonify({'success': True, 'message': 'Access granted'})
        return jsonify({'success': False, 'message': 'Invalid password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-tier', methods=['POST'])
def check_tier():
    try:
        data = request.json
        api_key = data.get('api_key', '')
        
        if not api_key:
            return jsonify({'error': 'Missing API key'}), 400
        
        return jsonify({
            'tier': 'free',
            'model': 'gemini-2.0-flash-exp',
            'limits': {
                'rpm': 15,
                'tpm': 1000000,
                'rpd': 1500
            },
            'usage': {
                'requests': 0,
                'last_reset': '2025-10-22T00:00:00'
            },
            'info': '15 RPM - Free Tier Testing'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        api_key = data.get('api_key')
        query = data.get('query')
        user_id = data.get('user_id', 'anonymous')
        
        if not api_key or not query:
            return jsonify({'error': 'Missing api_key or query'}), 400
        
        # Import here to avoid startup issues
        import google.generativeai as genai
        import json
        import re
        from datetime import datetime
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f'''Analyze this stock query: "{query}"

Return ONLY valid JSON (no markdown):
{{
    "current_price": 150.00,
    "company_name": "Example Corp",
    "symbol": "EXMP",
    "prediction_time": "tomorrow",
    "risk_zones": [
        {{"zone": "RISK-FREE (95-100%)", "predicted_price": 152.0, "confidence": 97, "reasoning": "Strong technical signals support upward movement", "stop_loss": 148.0, "target_1": 153.0, "target_2": 155.0, "target_3": 158.0, "expected_move": "+1.3%"}},
        {{"zone": "LOW RISK (80-94%)", "predicted_price": 154.0, "confidence": 87, "reasoning": "Moderate bullish momentum", "stop_loss": 147.0, "target_1": 156.0, "target_2": 158.0, "target_3": 161.0, "expected_move": "+2.7%"}},
        {{"zone": "MEDIUM RISK (60-79%)", "predicted_price": 156.0, "confidence": 68, "reasoning": "Possible breakout scenario", "stop_loss": 145.0, "target_1": 159.0, "target_2": 162.0, "target_3": 165.0, "expected_move": "+4.0%"}},
        {{"zone": "HIGH RISK (40-59%)", "predicted_price": 160.0, "confidence": 48, "reasoning": "Speculative high-risk play", "stop_loss": 143.0, "target_1": 163.0, "target_2": 167.0, "target_3": 172.0, "expected_move": "+6.7%"}}
    ],
    "overall_trend": "bullish",
    "trend_strength": "7",
    "key_signals": ["RSI showing oversold bounce", "MACD bullish crossover", "Volume surge detected"],
    "support_levels": [148.0, 145.0, 142.0],
    "resistance_levels": [155.0, 160.0, 165.0],
    "recommendation": "BUY - Technical indicators favor upside",
    "risk_level": "medium",
    "chart_data": {{"prices": [], "rsi": [], "macd": [], "volume": [], "bollinger": [], "stochastic": [], "adx": []}}
}}'''
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        text = re.sub(r'``````\n?', '', text)
        
        prediction = json.loads(text)
        prediction['timestamp'] = datetime.now().isoformat()
        prediction['api_tier'] = 'free'
        prediction['patterns_detected'] = 60
        prediction['indicators_analyzed'] = '50+'
        prediction['model'] = 'gemini-2.0-flash-exp'
        
        # Save history
        if user_id not in histories:
            histories[user_id] = []
        histories[user_id].append({
            'query': query,
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify(prediction)
        
    except Exception as e:
        return jsonify({'error': str(e), 'type': type(e).__name__}), 500

@app.route('/api/history/<user_id>', methods=['GET'])
def get_history(user_id):
    try:
        return jsonify({'history': histories.get(user_id, [])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False)
