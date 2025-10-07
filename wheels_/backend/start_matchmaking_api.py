#!/usr/bin/env python3
"""
WHEELS Matchmaking API Startup Script
Starts the Flask API server with optional database notification listener
"""

import os
import sys
import threading
import time
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_api_server():
    """Start the Flask API server"""
    try:
        logger.info("🚀 Starting WHEELS Matchmaking API Server...")
        
        # Import and run the Flask app
        from matchmaking_api import app
        
        # Configuration from environment variables
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('DEBUG', 'false').lower() == 'true'
        host = os.environ.get('HOST', '0.0.0.0')
        
        logger.info(f"🌐 Server starting on {host}:{port}")
        logger.info(f"🔧 Debug mode: {debug}")
        
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True,
            use_reloader=False  # Disable reloader when using threads
        )
        
    except Exception as e:
        logger.error(f"❌ Error starting API server: {e}")
        sys.exit(1)

def start_notification_listener():
    """Start the PostgreSQL notification listener (optional)"""
    try:
        # Check if psycopg2 is available
        try:
            import psycopg2
            import psycopg2.extensions
        except ImportError:
            logger.warning("📦 psycopg2 not installed. Notification listener disabled.")
            logger.info("💡 Install with: pip install psycopg2-binary")
            return
        
        # Database connection string
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            logger.warning("🔗 DATABASE_URL not set. Notification listener disabled.")
            return
        
        logger.info("👂 Starting PostgreSQL notification listener...")
        
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        
        cur = conn.cursor()
        cur.execute("LISTEN new_searching_pool_record;")
        
        logger.info("✅ Notification listener started successfully")
        
        while True:
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                try:
                    data = json.loads(notify.payload)
                    logger.info(f"🔔 Received notification: {data}")
                    
                    # Trigger matchmaking in a separate thread
                    threading.Thread(
                        target=trigger_matchmaking_api,
                        args=(data,),
                        daemon=True
                    ).start()
                    
                except Exception as e:
                    logger.error(f"❌ Error processing notification: {e}")
            
            time.sleep(1)  # Prevent busy waiting
            
    except Exception as e:
        logger.error(f"❌ Error in notification listener: {e}")

def trigger_matchmaking_api(data):
    """Trigger the matchmaking API when a notification is received"""
    try:
        import requests
        
        api_url = f"http://localhost:{os.environ.get('PORT', 5000)}/api/trigger-matchmaking"
        
        logger.info(f"🎯 Triggering matchmaking API for record: {data.get('record_id')}")
        
        response = requests.post(api_url, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            matches_count = result.get('total_matches', 0)
            logger.info(f"✅ Matchmaking completed: {matches_count} matches found")
        else:
            logger.warning(f"⚠️ Matchmaking API returned status: {response.status_code}")
            
    except Exception as e:
        logger.error(f"❌ Error triggering matchmaking API: {e}")

def check_dependencies():
    """Check if all required dependencies are installed"""
    logger.info("🔍 Checking dependencies...")
    
    required_packages = [
        'flask',
        'flask_cors',
        'supabase',
        'pandas',
        'geopy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            logger.error(f"❌ {package} - MISSING")
    
    if missing_packages:
        logger.error(f"💥 Missing packages: {', '.join(missing_packages)}")
        logger.info("📦 Install with: pip install -r requirements.txt")
        return False
    
    logger.info("✅ All dependencies satisfied")
    return True

def main():
    """Main entry point"""
    print("🚗 WHEELS Matchmaking API")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Configuration info
    logger.info("📋 Configuration:")
    logger.info(f"   Port: {os.environ.get('PORT', 5000)}")
    logger.info(f"   Debug: {os.environ.get('DEBUG', 'false')}")
    logger.info(f"   Host: {os.environ.get('HOST', '0.0.0.0')}")
    
    # Check for notification listener
    enable_listener = os.environ.get('ENABLE_NOTIFICATIONS', 'true').lower() == 'true'
    
    if enable_listener:
        logger.info("🔔 Notification listener: ENABLED")
        # Start notification listener in a separate thread
        listener_thread = threading.Thread(
            target=start_notification_listener,
            daemon=True
        )
        listener_thread.start()
    else:
        logger.info("🔕 Notification listener: DISABLED")
    
    # Start the API server (this blocks)
    start_api_server()

if __name__ == '__main__':
    main()




