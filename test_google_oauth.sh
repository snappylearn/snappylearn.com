#!/bin/bash

echo "=== Testing Google OAuth Integration ==="
echo

# Test 1: Check if backend endpoint exists
echo "1. Testing backend endpoint availability..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/google -X POST -H "Content-Type: application/json" -d '{"test": "data"}' | grep -q "405\|400" && echo "✓ Endpoint exists" || echo "✗ Endpoint not available"

# Test 2: Test with valid JWT credential for existing user
echo "2. Testing with existing user (test@example.com)..."
CREDENTIAL=$(node -e "
const header = Buffer.from(JSON.stringify({
  alg: 'RS256',
  kid: 'a43429e8b13f5e0d7a5975d45475df28aa221b25',
  typ: 'JWT'
})).toString('base64');

const payload = Buffer.from(JSON.stringify({
  iss: 'accounts.google.com',
  azp: '559650623795-agqubhoo2gsalqluntni3gf943s5dtca.apps.googleusercontent.com',
  aud: '559650623795-agqubhoo2gsalqluntni3gf943s5dtca.apps.googleusercontent.com',
  sub: '107055789671328899999',
  email: 'test@example.com',
  email_verified: true,
  at_hash: 'eRyF8DbPQlA1HEEK5ECbUA',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  given_name: 'Test',
  family_name: 'User',
  locale: 'en',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  jti: 'a1b2c3d4e5f6g7h8i9j0k1l2'
})).toString('base64');

console.log(header + '.' + payload + '.dummy_signature');
")

RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"credential\":\"$CREDENTIAL\"}" http://localhost:5000/api/auth/google)
echo "$RESPONSE" | grep -q "access_token" && echo "✓ Existing user authentication successful" || echo "✗ Existing user authentication failed"

# Test 3: Check user data structure
echo "3. Testing user data structure..."
echo "$RESPONSE" | grep -q "\"id\":" && echo "✓ User ID present" || echo "✗ User ID missing"
echo "$RESPONSE" | grep -q "\"email\":" && echo "✓ Email present" || echo "✗ Email missing"
echo "$RESPONSE" | grep -q "\"access_token\":" && echo "✓ Access token present" || echo "✗ Access token missing"

# Test 4: Check if Google OAuth button configuration exists
echo "4. Testing frontend Google OAuth configuration..."
curl -s http://localhost:5000 | grep -q "559650623795-agqubhoo2gsalqluntni3gf943s5dtca.apps.googleusercontent.com" && echo "✓ Google Client ID configured" || echo "✗ Google Client ID missing"

echo
echo "=== Google OAuth Integration Test Complete ==="