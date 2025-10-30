#!/usr/bin/env python3
"""
Supabase Connection Test Script
Tests the Supabase database connection and verifies the schema
"""

import os
import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional

class SupabaseConnectionTester:
    """Test Supabase connection and database schema"""
    
    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.supabase_url = supabase_url or os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("VITE_SUPABASE_ANON_KEY")
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test basic Supabase connection"""
        if not self.supabase_url or not self.supabase_key:
            return {
                "success": False,
                "error": "Missing Supabase credentials",
                "message": "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
            }
        
        try:
            # Test connection by querying profiles table
            response = requests.get(
                f"{self.supabase_url}/rest/v1/profiles",
                headers=self.headers,
                params={"select": "count"},
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "message": "Supabase connection successful",
                    "url": self.supabase_url
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "message": "Supabase connection failed"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Connection timeout",
                "message": "Supabase did not respond within 10 seconds"
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "Connection error",
                "message": "Could not connect to Supabase"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Unexpected error occurred"
            }
    
    def test_tables(self) -> Dict[str, Any]:
        """Test if all required tables exist"""
        tables = ["profiles", "chat_messages", "mood_logs", "achievements", "goals", "chat_sessions", "journal_entries"]
        results = {}
        
        for table in tables:
            try:
                response = requests.get(
                    f"{self.supabase_url}/rest/v1/{table}",
                    headers=self.headers,
                    params={"select": "count"},
                    timeout=5
                )
                
                if response.status_code == 200:
                    results[table] = {"exists": True, "status": "OK"}
                else:
                    results[table] = {"exists": False, "status": f"HTTP {response.status_code}"}
                    
            except Exception as e:
                results[table] = {"exists": False, "status": str(e)}
        
        return results
    
    def test_auth(self) -> Dict[str, Any]:
        """Test Supabase Auth service"""
        try:
            response = requests.get(
                f"{self.supabase_url}/auth/v1/settings",
                headers={"apikey": self.supabase_key},
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "Auth service accessible",
                    "status_code": response.status_code
                }
            else:
                return {
                    "success": False,
                    "message": f"Auth service error: HTTP {response.status_code}",
                    "status_code": response.status_code
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Auth service connection failed"
            }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all Supabase tests"""
        print("🗄️ Testing Supabase Connection")
        print("=" * 50)
        
        if not self.supabase_url or not self.supabase_key:
            print("❌ No Supabase credentials configured")
            print("Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
            return {"success": False, "error": "No credentials"}
        
        print(f"🔗 Testing Supabase: {self.supabase_url}")
        print()
        
        tests = [
            ("Connection", self.test_connection),
            ("Auth Service", self.test_auth),
            ("Tables", self.test_tables)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"📋 Testing {test_name}...")
            result = test_func()
            results[test_name] = result
            
            if test_name == "Tables":
                # Special handling for tables test
                table_results = result
                table_count = sum(1 for table_result in table_results.values() if table_result.get("exists", False))
                total_tables = len(table_results)
                
                print(f"✅ {test_name}: {table_count}/{total_tables} tables found")
                for table_name, table_result in table_results.items():
                    status = "✅" if table_result.get("exists", False) else "❌"
                    print(f"   {status} {table_name}: {table_result.get('status', 'Unknown')}")
                
                if table_count == total_tables:
                    passed += 1
            else:
                if result.get("success", False):
                    print(f"✅ {test_name}: PASSED")
                    passed += 1
                else:
                    print(f"❌ {test_name}: FAILED")
                    if "error" in result:
                        print(f"   Error: {result['error']}")
            
            print()
        
        # Summary
        print("=" * 50)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Supabase connection is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the errors above.")
        
        return {
            "success": passed == total,
            "passed": passed,
            "total": total,
            "results": results
        }

def main():
    """Main function to test Supabase connection"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Supabase connection")
    parser.add_argument("--url", help="Supabase URL to test")
    parser.add_argument("--key", help="Supabase anon key to test")
    
    args = parser.parse_args()
    
    # Initialize tester
    tester = SupabaseConnectionTester(args.url, args.key)
    
    # Run tests
    tester.run_all_tests()

if __name__ == "__main__":
    main()

