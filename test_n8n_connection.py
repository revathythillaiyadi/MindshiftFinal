#!/usr/bin/env python3
"""
N8N Connection Test Script
Tests the n8n webhook connection and validates the integration
"""

import os
import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class N8NConnectionTester:
    """Test n8n webhook connection and integration"""
    
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or os.getenv("N8N_WEBHOOK_URL")
        self.test_results = []
    
    def test_webhook_connection(self) -> Dict[str, Any]:
        """Test basic webhook connectivity"""
        if not self.webhook_url:
            return {
                "success": False,
                "error": "No webhook URL configured",
                "message": "Set N8N_WEBHOOK_URL environment variable or pass webhook_url parameter"
            }
        
        test_data = {
            "event": "test_connection",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "message": "Testing n8n webhook connection from Mindshift app",
                "test_type": "connectivity",
                "source": "mindshift-app"
            },
            "source": "mindshift-app"
        }
        
        try:
            response = requests.post(
                self.webhook_url,
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "message": "Webhook connection successful",
                    "response": response.text
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "message": "Webhook responded with error"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Connection timeout",
                "message": "Webhook did not respond within 10 seconds"
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "Connection error",
                "message": "Could not connect to webhook URL"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Unexpected error occurred"
            }
    
    def test_chat_event(self) -> Dict[str, Any]:
        """Test chat interaction event"""
        test_data = {
            "event": "chat_interaction",
            "userId": "test_user_123",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "message": "I can't succeed because I'm not experienced enough",
                "response": "Let me help you reframe that belief using SOM patterns...",
                "mode": "reframe",
                "sessionId": "test_session_456"
            },
            "source": "mindshift-app"
        }
        
        return self._send_test_event(test_data, "chat_interaction")
    
    def test_mood_event(self) -> Dict[str, Any]:
        """Test mood logging event"""
        test_data = {
            "event": "mood_logged",
            "userId": "test_user_123",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "moodValue": 7,
                "moodLabel": "Good",
                "notes": "Feeling optimistic about my progress"
            },
            "source": "mindshift-app"
        }
        
        return self._send_test_event(test_data, "mood_logged")
    
    def test_journal_event(self) -> Dict[str, Any]:
        """Test journal entry event"""
        test_data = {
            "event": "journal_entry",
            "userId": "test_user_123",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "title": "Reflecting on my limiting beliefs",
                "content": "Today I realized that my belief about not being experienced enough is holding me back...",
                "entryDate": datetime.now().isoformat()
            },
            "source": "mindshift-app"
        }
        
        return self._send_test_event(test_data, "journal_entry")
    
    def test_goal_event(self) -> Dict[str, Any]:
        """Test goal tracking event"""
        test_data = {
            "event": "goal_action",
            "userId": "test_user_123",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "title": "Practice SOM patterns daily",
                "completed": False,
                "action": "created"
            },
            "source": "mindshift-app"
        }
        
        return self._send_test_event(test_data, "goal_action")
    
    def _send_test_event(self, data: Dict[str, Any], event_type: str) -> Dict[str, Any]:
        """Send a test event to the webhook"""
        if not self.webhook_url:
            return {
                "success": False,
                "error": "No webhook URL configured",
                "event_type": event_type
            }
        
        try:
            response = requests.post(
                self.webhook_url,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "event_type": event_type,
                    "status_code": response.status_code,
                    "message": f"{event_type} event sent successfully"
                }
            else:
                return {
                    "success": False,
                    "event_type": event_type,
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "event_type": event_type,
                "error": str(e)
            }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all webhook tests"""
        print("🧪 Testing N8N Webhook Connection")
        print("=" * 50)
        
        if not self.webhook_url:
            print("❌ No webhook URL configured")
            print("Please set N8N_WEBHOOK_URL environment variable")
            return {"success": False, "error": "No webhook URL"}
        
        print(f"🔗 Testing webhook: {self.webhook_url}")
        print()
        
        tests = [
            ("Basic Connection", self.test_webhook_connection),
            ("Chat Event", self.test_chat_event),
            ("Mood Event", self.test_mood_event),
            ("Journal Event", self.test_journal_event),
            ("Goal Event", self.test_goal_event)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"📋 Testing {test_name}...")
            result = test_func()
            results[test_name] = result
            
            if result["success"]:
                print(f"✅ {test_name}: PASSED")
                passed += 1
            else:
                print(f"❌ {test_name}: FAILED")
                if "error" in result:
                    print(f"   Error: {result['error']}")
            
            # Small delay between tests
            time.sleep(1)
            print()
        
        # Summary
        print("=" * 50)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! N8N connection is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the errors above.")
        
        return {
            "success": passed == total,
            "passed": passed,
            "total": total,
            "results": results
        }

def main():
    """Main function to test n8n connection"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test N8N webhook connection")
    parser.add_argument("--webhook-url", help="N8N webhook URL to test")
    parser.add_argument("--test-type", choices=["all", "connection", "chat", "mood", "journal", "goal"], 
                       default="all", help="Type of test to run")
    
    args = parser.parse_args()
    
    # Initialize tester
    tester = N8NConnectionTester(args.webhook_url)
    
    if args.test_type == "all":
        tester.run_all_tests()
    elif args.test_type == "connection":
        result = tester.test_webhook_connection()
        print("Connection test result:", result)
    elif args.test_type == "chat":
        result = tester.test_chat_event()
        print("Chat event test result:", result)
    elif args.test_type == "mood":
        result = tester.test_mood_event()
        print("Mood event test result:", result)
    elif args.test_type == "journal":
        result = tester.test_journal_event()
        print("Journal event test result:", result)
    elif args.test_type == "goal":
        result = tester.test_goal_event()
        print("Goal event test result:", result)

if __name__ == "__main__":
    main()

