const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoint(endpoint, method = 'get', data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${endpoint}: SUCCESS`);
    console.log(`   Status: ${response.status}`);
    
    if (response.data) {
      if (response.data.data) {
        console.log(`   Data: Exists (${Array.isArray(response.data.data) ? response.data.data.length + ' items' : 'Object'})`);
        if (Object.keys(response.data.data).length > 0) {
          const sample = Array.isArray(response.data.data) 
            ? response.data.data.slice(0, 3) 
            : response.data.data;
          console.log(`   Sample: ${JSON.stringify(sample).substring(0, 100)}...`);
        }
      } else {
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
    }
  } catch (error) {
    console.log(`❌ ${method.toUpperCase()} ${endpoint}: ERROR`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.response.data.error || JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('---');
}

async function runTests() {
  console.log('🚀 Testing SpaceGame API Endpoints\n');
  let authToken = null;

  // Test health check
  await testEndpoint('/healthcheck');

  // Test user endpoints (using a test address)
  const testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  await testEndpoint(`/user/${testAddress}`);
  await testEndpoint(`/user/${testAddress}/fleet`);
  await testEndpoint(`/user/${testAddress}/ships`);
  await testEndpoint(`/user/${testAddress}/resources`);

  // Test marketplace
  await testEndpoint('/marketplace/listings');
  await testEndpoint('/marketplace/stats');

  // Test packs
  await testEndpoint('/packs');
  await testEndpoint('/packs/available');
  await testEndpoint('/packs/purchased');

  // Test game endpoints
  await testEndpoint('/game/planets');
  await testEndpoint('/game/ships');
  await testEndpoint('/game/resources');

  // Test auth (generate token)
  console.log('Testing authentication...');
  const authResponse = await axios.post(`${BASE_URL}/auth/token`, {
    address: testAddress
  }).catch(err => null);
  
  if (authResponse && authResponse.data && authResponse.data.token) {
    authToken = authResponse.data.token;
    console.log('✅ Authentication: SUCCESS');
    console.log(`   Token received: ${authToken.substring(0, 20)}...`);
    console.log('---');
    
    // Test authenticated endpoints
    console.log('Testing authenticated endpoints...');
    await testEndpoint('/user/profile', 'get', null, authToken);
    await testEndpoint('/user/inventory', 'get', null, authToken);
    
    // Test creating a listing (if marketplace is implemented)
    await testEndpoint('/marketplace/create', 'post', {
      type: 'ship',
      itemId: 1,
      price: 100
    }, authToken);
  } else {
    console.log('❌ Authentication: FAILED');
    console.log('---');
  }

  // Test stats
  await testEndpoint('/stats/global');
  await testEndpoint('/stats/leaderboard');

  console.log('🎉 All tests completed!');
}

runTests().catch(console.error);