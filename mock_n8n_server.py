#!/usr/bin/env python3
"""
Mock N8N Webhook Server for Testing
Creates a simple HTTP server to test the n8n webhook integration
"""

import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

class MockWebhookHandler(BaseHTTPRequestHandler):
    """Mock webhook handler for testing n8n integration"""
    
    def do_POST(self):
        """Handle POST requests to the webhook"""
        try:
            # Parse the request
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            
            # Log the received data
            print(f"\n📨 Received webhook data:")
            print(f"   Event: {data.get('event', 'unknown')}")
            print(f"   User ID: {data.get('userId', 'unknown')}")
            print(f"   Timestamp: {data.get('timestamp', 'unknown')}")
            print(f"   Source: {data.get('source', 'unknown')}")
            
            if 'data' in data:
                print(f"   Data: {json.dumps(data['data'], indent=2)}")
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "success": True,
                "message": "Webhook received successfully",
                "event": data.get('event'),
                "timestamp": time.time()
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"❌ Error processing webhook: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "success": False,
                "error": str(e)
            }
            
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_GET(self):
        """Handle GET requests (health check)"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "status": "running",
            "message": "Mock N8N webhook server is running",
            "timestamp": time.time()
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass

def start_mock_server(port=8080):
    """Start the mock webhook server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockWebhookHandler)
    
    print(f"🚀 Starting mock N8N webhook server on port {port}")
    print(f"📡 Webhook URL: http://localhost:{port}/webhook/mindshift")
    print(f"🔍 Health check: http://localhost:{port}/")
    print("\n📋 To test the integration:")
    print(f"1. Set VITE_N8N_WEBHOOK_URL=http://localhost:{port}/webhook/mindshift")
    print("2. Restart your Vite development server")
    print("3. Go to Dashboard and click 'Test Webhook Connection'")
    print("\n⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Stopping mock webhook server...")
        httpd.shutdown()

def test_webhook_with_mock():
    """Test the webhook integration with the mock server"""
    import requests
    import threading
    import time
    
    # Start mock server in background
    server_thread = threading.Thread(target=start_mock_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    time.sleep(2)
    
    # Test the webhook
    test_data = {
        "event": "test_connection",
        "userId": "test_user_123",
        "timestamp": time.time(),
        "data": {
            "message": "Testing mock webhook server",
            "test_type": "integration_test"
        },
        "source": "mindshift-app"
    }
    
    try:
        response = requests.post(
            "http://localhost:8080/webhook/mindshift",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            print("✅ Mock webhook test successful!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Mock webhook test failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing mock webhook: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_webhook_with_mock()
    else:
        start_mock_server()

