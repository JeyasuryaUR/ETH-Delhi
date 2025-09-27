// Test script for Walrus integration
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/ratings';

async function testWalrusIntegration() {
  console.log('🧪 Testing Walrus Integration for Chess Ratings\n');

  try {
    // Test 1: Store rating data in Walrus
    console.log('1️⃣ Testing store rating data in Walrus...');
    const storeResponse = await axios.post(`${BASE_URL}/store`, {
      chessUsername: 'magnuscarlsen',
      lichessUsername: 'DrNykterstein',
      fideId: '1503014'
    });

    console.log('✅ Store Response:', {
      success: storeResponse.data.success,
      quiltPatchIds: storeResponse.data.quiltPatchIds,
      walrusBlobId: storeResponse.data.walrus?.blobStoreResult?.newlyCreated?.blobObject?.blobId
    });

    // Test 2: Retrieve rating data from Walrus
    if (storeResponse.data.quiltPatchIds && storeResponse.data.quiltPatchIds.length > 0) {
      console.log('\n2️⃣ Testing retrieve rating data from Walrus...');
      const quiltPatchId = storeResponse.data.quiltPatchIds[0].quiltPatchId;
      
      const retrieveResponse = await axios.get(`${BASE_URL}/retrieve/${quiltPatchId}`);
      console.log('✅ Retrieve Response:', {
        success: retrieveResponse.data.success,
        dataType: typeof retrieveResponse.data.data
      });
    }

    // Test 3: Get rating data without storing
    console.log('\n3️⃣ Testing get rating data (without storing)...');
    const getRatingResponse = await axios.post(`${BASE_URL}/getRating`, {
      chessUsername: 'magnuscarlsen',
      lichessUsername: 'DrNykterstein',
      fideId: '1503014'
    });

    console.log('✅ Get Rating Response:', {
      chessCom: getRatingResponse.data.chessCom,
      lichess: getRatingResponse.data.lichess,
      fide: getRatingResponse.data.fide,
      averages: getRatingResponse.data.averages
    });

    // Test 4: Update user rating
    console.log('\n4️⃣ Testing update user rating...');
    const updateResponse = await axios.post(`${BASE_URL}/update`, {
      userId: 'test-user-id', // You'll need to replace with actual user ID
      ratingChange: 50, // Increase rating by 50 points
      ratingType: 'standard'
    });

    console.log('✅ Update Response:', {
      success: updateResponse.data.success,
      ratingChange: updateResponse.data.ratingChange,
      newRating: updateResponse.data.newRating,
      newBlobId: updateResponse.data.user?.walrus_blob_id
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testWalrusIntegration();
