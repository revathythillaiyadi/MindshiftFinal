#!/usr/bin/env python3
"""
Supabase User Management Script
Fixes authentication issues by managing user accounts
"""

import os
import requests
import json
from typing import Dict, Any, Optional

class SupabaseUserManager:
    """Manage Supabase users and fix authentication issues"""
    
    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.supabase_url = supabase_url or os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("VITE_SUPABASE_ANON_KEY")
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }
    
    def check_user_exists(self, email: str) -> Dict[str, Any]:
        """Check if a user exists in the profiles table"""
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/profiles",
                headers=self.headers,
                params={"email": f"eq.{email}", "select": "*"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "exists": len(data) > 0,
                    "user": data[0] if data else None,
                    "count": len(data)
                }
            else:
                return {
                    "exists": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "exists": False,
                "error": str(e)
            }
    
    def delete_user_profile(self, email: str) -> Dict[str, Any]:
        """Delete a user profile from the profiles table"""
        try:
            response = requests.delete(
                f"{self.supabase_url}/rest/v1/profiles",
                headers=self.headers,
                params={"email": f"eq.{email}"},
                timeout=10
            )
            
            if response.status_code in [200, 204]:
                return {
                    "success": True,
                    "message": f"Profile for {email} deleted successfully"
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def create_user_profile(self, email: str, display_name: str) -> Dict[str, Any]:
        """Create a new user profile"""
        try:
            profile_data = {
                "email": email,
                "display_name": display_name,
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity_date": None
            }
            
            response = requests.post(
                f"{self.supabase_url}/rest/v1/profiles",
                headers=self.headers,
                json=profile_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                return {
                    "success": True,
                    "message": f"Profile for {email} created successfully",
                    "data": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def fix_user_account(self, email: str, display_name: str = None) -> Dict[str, Any]:
        """Fix user account issues by cleaning up and recreating if needed"""
        print(f"🔧 Fixing user account for: {email}")
        
        # Check if user exists
        user_check = self.check_user_exists(email)
        
        if user_check.get("exists", False):
            print(f"✅ User {email} exists in profiles table")
            user_data = user_check.get("user")
            if user_data:
                print(f"   Display Name: {user_data.get('display_name', 'N/A')}")
                print(f"   Created: {user_data.get('created_at', 'N/A')}")
                print(f"   Current Streak: {user_data.get('current_streak', 0)}")
            
            # Ask if user wants to delete and recreate
            print(f"\n⚠️ User {email} already exists.")
            print("Options:")
            print("1. Keep existing account")
            print("2. Delete and recreate account")
            
            choice = input("Enter choice (1 or 2): ").strip()
            
            if choice == "2":
                print(f"🗑️ Deleting existing profile for {email}...")
                delete_result = self.delete_user_profile(email)
                
                if delete_result.get("success", False):
                    print(f"✅ {delete_result['message']}")
                    
                    # Recreate profile
                    if display_name:
                        print(f"🔄 Creating new profile for {email}...")
                        create_result = self.create_user_profile(email, display_name)
                        
                        if create_result.get("success", False):
                            print(f"✅ {create_result['message']}")
                            return {"success": True, "action": "recreated"}
                        else:
                            print(f"❌ Failed to recreate profile: {create_result.get('error')}")
                            return {"success": False, "error": create_result.get('error')}
                    else:
                        return {"success": True, "action": "deleted"}
                else:
                    print(f"❌ Failed to delete profile: {delete_result.get('error')}")
                    return {"success": False, "error": delete_result.get('error')}
            else:
                return {"success": True, "action": "kept_existing"}
        else:
            print(f"ℹ️ User {email} does not exist in profiles table")
            
            # Create new profile
            if display_name:
                print(f"🔄 Creating new profile for {email}...")
                create_result = self.create_user_profile(email, display_name)
                
                if create_result.get("success", False):
                    print(f"✅ {create_result['message']}")
                    return {"success": True, "action": "created"}
                else:
                    print(f"❌ Failed to create profile: {create_result.get('error')}")
                    return {"success": False, "error": create_result.get('error')}
            else:
                return {"success": True, "action": "not_found"}

def main():
    """Main function to fix user authentication issues"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix Supabase user authentication issues")
    parser.add_argument("--email", required=True, help="Email address to fix")
    parser.add_argument("--display-name", help="Display name for the user")
    parser.add_argument("--check-only", action="store_true", help="Only check if user exists")
    
    args = parser.parse_args()
    
    # Initialize manager
    manager = SupabaseUserManager()
    
    if args.check_only:
        print(f"🔍 Checking user: {args.email}")
        result = manager.check_user_exists(args.email)
        
        if result.get("exists", False):
            print(f"✅ User {args.email} exists")
            user_data = result.get("user")
            if user_data:
                print(f"   Display Name: {user_data.get('display_name', 'N/A')}")
                print(f"   Created: {user_data.get('created_at', 'N/A')}")
        else:
            print(f"❌ User {args.email} does not exist")
            if "error" in result:
                print(f"   Error: {result['error']}")
    else:
        result = manager.fix_user_account(args.email, args.display_name)
        
        if result.get("success", False):
            print(f"\n🎉 Successfully fixed user account!")
            print(f"Action taken: {result.get('action', 'unknown')}")
        else:
            print(f"\n❌ Failed to fix user account: {result.get('error')}")

if __name__ == "__main__":
    main()

