// Test script to verify backend authentication endpoints
const API_BASE_URL = 'http://localhost:4000';

async function testBackend() {
  console.log('Testing Backend Authentication API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('');

    // Test registration
    console.log('2. Testing user registration...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'teacher',
      phone: '+1234567890',
      schoolId: 'SCH001'
    };

    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful:', registerData.message);
      console.log('User ID:', registerData.user.id);
      console.log('Token received:', !!registerData.user.token);
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }
    console.log('');

    // Test login
    console.log('3. Testing user login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login successful:', loginData.message);
      console.log('User role:', loginData.user.role);
      console.log('Token received:', !!loginData.user.token);
      
      // Test protected route
      console.log('');
      console.log('4. Testing protected profile endpoint...');
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.user.token}`,
        },
      });

      const profileData = await profileResponse.json();
      
      if (profileResponse.ok) {
        console.log('✅ Profile fetch successful');
        console.log('User name:', profileData.user.name);
        console.log('User email:', profileData.user.email);
      } else {
        console.log('❌ Profile fetch failed:', profileData.message);
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testBackend();

