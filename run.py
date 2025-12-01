#!/usr/bin/env python3
import subprocess
import sys
import os
import threading
import time
import webbrowser
from flask import Flask, send_from_directory

def start_api():
    """Start the Flask API server"""
    print("🚀 Starting API server on port 5000...")
    os.chdir('api')
    subprocess.run([sys.executable, 'app.py'])

def start_website():
    """Start the website server"""
    print("🌐 Starting website server on port 8000...")
    os.chdir('..')
    
    # Create a simple Flask server to serve index.html
    app = Flask(__name__, static_folder='.', static_url_path='')
    
    @app.route('/')
    def serve_index():
        return send_from_directory('.', 'index.html')
    
    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory('.', path)
    
    print("✅ Website running at: http://localhost:8000")
    print("✅ API running at: http://localhost:5000")
    print("\n📊 Open your browser to: http://localhost:8000")
    print("🔧 API documentation: http://localhost:5000")
    print("🔗 Hidden API page: http://localhost:8000/#api")
    print("\n🛑 Press Ctrl+C to stop both servers")
    
    app.run(host='0.0.0.0', port=8000, debug=False, use_reloader=False)

def main():
    print("=" * 50)
    print("       PAGESOFTWO WEBSITE + API")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('api/app.py'):
        print("❌ Error: api/app.py not found!")
        print("💡 Make sure you're in the pagesoftwo-web folder")
        return
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed")
    except:
        print("⚠️  Could not install dependencies automatically")
        print("💡 Try running: pip install -r requirements.txt")
    
    # Start API in a separate thread
    api_thread = threading.Thread(target=start_api, daemon=True)
    api_thread.start()
    
    # Wait a moment for API to start
    time.sleep(2)
    
    # Open browser
    print("\n🌍 Opening browser...")
    webbrowser.open('http://localhost:8000')
    
    # Start website (this will block)
    start_website()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down...")
        sys.exit(0)