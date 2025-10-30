#!/usr/bin/env python3
"""
Comprehensive Supabase Auth Fix
Handles both auth.users and profiles table issues
"""

import os
import requests
import json
from typing import Dict, Any, Optional

class SupabaseAuthFixer:
    """Comprehensive Supabase authentication fixer"""
    
    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.supabase_url = supabase_url or os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("VITE_SUPABASE_ANON_KEY")
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }
    
    def check_auth_user(self, email: str) -> Dict[str, Any]:
        """Check if user exists in auth.users table"""
        try:
            # Use Supabase Admin API to check auth users
            response = requests.get(
                f"{self.supabase_url}/auth/v1/admin/users",
                headers={
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json"
                },
                params={"email": email},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                users = data.get("users", [])
                return {
                    "exists": len(users) > 0,
                    "user": users[0] if users else None,
                    "count": len(users)
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
    
    def check_profile_user(self, email: str) -> Dict[str, Any]:
        """Check if user exists in profiles table"""
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
    
    def create_profile_for_auth_user(self, email: str, display_name: str = None) -> Dict[str, Any]:
        """Create a profile for an existing auth user"""
        try:
            # First, get the auth user to get their ID
            auth_check = self.check_auth_user(email)
            
            if not auth_check.get("exists", False):
                return {
                    "success": False,
                    "error": "User does not exist in auth.users table"
                }
            
            auth_user = auth_check.get("user")
            user_id = auth_user.get("id")
            
            # Create profile with the auth user's ID
            profile_data = {
                "id": user_id,
                "email": email,
                "display_name": display_name or email.split("@")[0],
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
                    "message": f"Profile created for {email}",
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
    
    def fix_user_authentication(self, email: str, display_name: str = None) -> Dict[str, Any]:
        """Comprehensive fix for user authentication issues"""
        print(f"🔧 Comprehensive Auth Fix for: {email}")
        print("=" * 50)
        
        # Check auth.users table
        print("1️⃣ Checking auth.users table...")
        auth_check = self.check_auth_user(email)
        
        if auth_check.get("exists", False):
            print(f"✅ User exists in auth.users table")
            auth_user = auth_check.get("user")
            print(f"   ID: {auth_user.get('id', 'N/A')}")
            print(f"   Email Confirmed: {auth_user.get('email_confirmed_at', 'No')}")
            print(f"   Created: {auth_user.get('created_at', 'N/A')}")
        else:
            print(f"❌ User does not exist in auth.users table")
            if "error" in auth_check:
                print(f"   Error: {auth_check['error']}")
        
        # Check profiles table
        print("\n2️⃣ Checking profiles table...")
        profile_check = self.check_profile_user(email)
        
        if profile_check.get("exists", False):
            print(f"✅ User exists in profiles table")
            profile_user = profile_check.get("user")
            print(f"   Display Name: {profile_user.get('display_name', 'N/A')}")
            print(f"   Created: {profile_user.get('created_at', 'N/A')}")
        else:
            print(f"❌ User does not exist in profiles table")
            if "error" in profile_check:
                print(f"   Error: {profile_check['error']}")
        
        # Determine the issue and fix
        print("\n3️⃣ Determining fix needed...")
        
        if auth_check.get("exists", False) and not profile_check.get("exists", False):
            print("🔍 Issue: User exists in auth.users but not in profiles")
            print("🔄 Creating missing profile...")
            
            result = self.create_profile_for_auth_user(email, display_name)
            
            if result.get("success", False):
                print(f"✅ {result['message']}")
                return {"success": True, "issue": "missing_profile", "action": "created_profile"}
            else:
                print(f"❌ Failed to create profile: {result.get('error')}")
                return {"success": False, "error": result.get('error')}
        
        elif not auth_check.get("exists", False) and not profile_check.get("exists", False):
            print("🔍 Issue: User does not exist in either table")
            print("ℹ️ User can sign up normally")
            return {"success": True, "issue": "user_not_exists", "action": "can_signup"}
        
        elif auth_check.get("exists", False) and profile_check.get("exists", False):
            print("🔍 Issue: User exists in both tables")
            print("ℹ️ User should be able to sign in normally")
            return {"success": True, "issue": "user_exists", "action": "can_signin"}
        
        else:
            print("🔍 Issue: Unknown state")
            return {"success": False, "issue": "unknown", "error": "Unknown authentication state"}

def main():
    """Main function to fix authentication issues"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix Supabase authentication issues")
    parser.add_argument("--email", required=True, help="Email address to fix")
    parser.add_argument("--display-name", help="Display name for the user")
    
    args = parser.parse_args()
    
    # Initialize fixer
    fixer = SupabaseAuthFixer()
    
    result = fixer.fix_user_authentication(args.email, args.display_name)
    
    print("\n" + "=" * 50)
    if result.get("success", False):
        print("🎉 Authentication fix completed!")
        print(f"Issue: {result.get('issue', 'unknown')}")
        print(f"Action: {result.get('action', 'unknown')}")
        print("\n💡 Next steps:")
        if result.get("action") == "created_profile":
            print("   - Try signing in with your email and password")
        elif result.get("action") == "can_signup":
            print("   - Try signing up with your email and password")
        elif result.get("action") == "can_signin":
            print("   - Try signing in with your email and password")
    else:
        print("❌ Authentication fix failed!")
        print(f"Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()

