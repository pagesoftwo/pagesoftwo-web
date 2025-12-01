#!/usr/bin/env python3
import subprocess
import sys
import os
import webbrowser
from time import sleep

def main():
    print("=" * 50)
    print("PAGESOFTWO WEBSITE & API")
    print("=" * 50)
    
    # Check Python version
    print(f"Python version: {sys.version.split()[0]}")
    
    # Install dependencies
    print("\n[1/3] Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed")
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        print("Try running: pip install -r requirements.txt")
        return
    
    # Start API server
    print("\n[2/3] Starting API server...")
    api_process = subprocess.Popen([sys.executable, "api/app.py"])
    
    # Wait for API to start
    sleep(3)
    
    # Open website
    print("\n[3/3] Opening website...")
    print("\n" + "=" * 50)
    print("SERVERS RUNNING:")
    print("- Website: http://localhost:8000")
    print("- API:     http://localhost:5000")
    print("- API Docs: http://localhost:5000/")
    print("\nENDPOINTS:")
    print("- GET /api/data      - All site data")
    print("- GET /api/projects  - Projects list")
    print("- GET /api/stats     - Statistics")
    print("- POST /api/visitors - Increment visitors")
    print("- POST /api/log      - Add log entry")
    print("=" * 50)
    
    # Start simple HTTP server for website
    print("\nStarting website server (Ctrl+C to stop all)...")
    try:
        # For Python 3.x
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        subprocess.call([sys.executable, "-m", "http.server", "8000"])
    except KeyboardInterrupt:
        print("\nShutting down...")
        api_process.terminate()
        api_process.wait()

if __name__ == "__main__":
    main()