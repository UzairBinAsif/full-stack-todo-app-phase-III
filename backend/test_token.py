"""Quick script to test JWT token decoding."""

import jwt
import sys

if len(sys.argv) < 2:
    print("Usage: python test_token.py <token>")
    sys.exit(1)

token = sys.argv[1]
secret = "KyJghFrDygCr1K5b9uQf7oNOb6S1Ihoq"

print(f"Token (first 50 chars): {token[:50]}...")
print(f"Token length: {len(token)}")
print()

# Try to decode without verification first to see payload
try:
    unverified = jwt.decode(token, options={"verify_signature": False})
    print("Unverified payload:")
    for key, value in unverified.items():
        print(f"  {key}: {value}")
    print()
except Exception as e:
    print(f"Failed to decode (unverified): {e}")
    print()

# Try with HS256 verification
try:
    verified = jwt.decode(token, secret, algorithms=["HS256"])
    print("✅ Verified with HS256:")
    for key, value in verified.items():
        print(f"  {key}: {value}")
except Exception as e:
    print(f"❌ Failed to verify with HS256: {e}")
