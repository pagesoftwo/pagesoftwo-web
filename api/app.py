from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)  # Allow all origins

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data.json')

def init_data():
    """Initialize data file with default values"""
    if not os.path.exists(DATA_FILE):
        default_data = {
            "site_info": {
                "name": "pagesoftwo",
                "version": "1.0.0",
                "online": True,
                "visitor_count": 0,
                "last_updated": datetime.now().isoformat()
            },
            "projects": [
                {
                    "id": 1,
                    "name": "Pages website",
                    "description": "Interactive website experimenting with HTML/CSS/JS",
                    "status": "active",
                    "tags": ["web", "experiment"]
                },
                {
                    "id": 2,
                    "name": "Cross-platform API",
                    "description": "Exploring application interaction with configurable options",
                    "status": "in-progress",
                    "tags": ["api", "system"]
                }
            ],
            "statistics": {
                "total_visits": 0,
                "api_calls": 0,
                "uptime": "99.8%",
                "response_time": "125ms"
            },
            "logs": []
        }
        save_data(default_data)
        print(f"📁 Created data file: {DATA_FILE}")

def load_data():
    """Load data from JSON file"""
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        init_data()
        return load_data()

def save_data(data):
    """Save data to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize on startup
init_data()

@app.route('/')
def home():
    """API homepage with documentation"""
    data = load_data()
    data['statistics']['api_calls'] += 1
    save_data(data)
    
    return jsonify({
        "status": "success",
        "message": "Welcome to pagesoftwo API",
        "version": "1.0.0",
        "website": "http://localhost:8000",
        "endpoints": {
            "/api/data": "GET - All site data",
            "/api/projects": "GET - Projects list",
            "/api/stats": "GET - Statistics",
            "/api/visitors": "GET/POST - Visitor count",
            "/api/log": "POST - Add log entry",
            "/api/status": "GET - API status"
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get all site data"""
    data = load_data()
    data['statistics']['api_calls'] += 1
    data['site_info']['last_updated'] = datetime.now().isoformat()
    save_data(data)
    
    return jsonify({
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "data": data
    })

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get projects list"""
    data = load_data()
    data['statistics']['api_calls'] += 1
    save_data(data)
    
    return jsonify({
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "count": len(data['projects']),
        "projects": data['projects']
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics"""
    data = load_data()
    data['statistics']['api_calls'] += 1
    save_data(data)
    
    return jsonify({
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "statistics": data['statistics']
    })

@app.route('/api/visitors', methods=['GET', 'POST'])
def visitors():
    """Handle visitor count"""
    data = load_data()
    data['statistics']['api_calls'] += 1
    
    if request.method == 'POST':
        data['site_info']['visitor_count'] += 1
        data['statistics']['total_visits'] += 1
        print(f"👤 Visitor count: {data['site_info']['visitor_count']}")
    
    save_data(data)
    
    return jsonify({
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "visitor_count": data['site_info']['visitor_count'],
        "total_visits": data['statistics']['total_visits']
    })

@app.route('/api/log', methods=['POST'])
def add_log():
    """Add log entry"""
    try:
        log_data = request.json
        data = load_data()
        data['statistics']['api_calls'] += 1
        
        log_entry = {
            "id": len(data['logs']) + 1,
            "timestamp": datetime.now().isoformat(),
            "data": log_data
        }
        
        data['logs'].append(log_entry)
        save_data(data)
        
        return jsonify({
            "status": "success",
            "message": "Log entry added",
            "log_id": log_entry['id'],
            "timestamp": log_entry['timestamp']
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

@app.route('/api/status', methods=['GET'])
def status():
    """API status check"""
    return jsonify({
        "status": "online",
        "service": "pagesoftwo API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("=" * 50)
    print("       PAGESOFTWO API SERVER")
    print("=" * 50)
    print(f"📂 Data file: {DATA_FILE}")
    print("🔗 Website: http://localhost:8000")
    print("\n📡 API Endpoints:")
    print("  http://localhost:5000/")
    print("  http://localhost:5000/api/data")
    print("  http://localhost:5000/api/projects")
    print("  http://localhost:5000/api/stats")
    print("  http://localhost:5000/api/visitors")
    print("  http://localhost:5000/api/status")
    print("\n🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    try:
        app.run(debug=False, port=5000, host='0.0.0.0')
    except KeyboardInterrupt:
        print("\n👋 API server stopped")