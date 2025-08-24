const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoint(endpoint, method = 'get', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${endpoint}: SUCCESS`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data.data ? 'Exists' : 'No data')}`);
    if (response.data.data && Object.keys(response.data.data).length > 0) {
      console.log(`   Sample: ${JSON.stringify(Object.keys(response.data.data))}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: ERROR`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.response.data.error}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('---');
}

async function runTests() {
  console.log('🚀 Testing SpaceGame API Endpoints\n');

  // Test health check
  await testEndpoint('/healthcheck');

  // Test user endpoints (using a test address)
  await testEndpoint('/user/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  await testEndpoint('/user/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/fleet');

  // Test marketplace
  await testEndpoint('/marketplace/listings');

  // Test packs
  await testEndpoint('/packs');

  // Test stats
//   await testEndpoint('/stats/global');

  // Test auth (generate token)
  await testEndpoint('/auth/token', 'post', {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  });

  console.log('🎉 All tests completed!');
}

runTests().catch(console.error);