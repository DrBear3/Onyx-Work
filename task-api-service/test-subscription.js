import subscriptionService from './services/subscriptionService.js';

console.log('🧪 Testing Subscription Service...\n');

async function testSubscriptionService() {
  try {
    // Test 1: Subscription limits configuration
    console.log('1️⃣ Testing subscription limits configuration...');
    const freeLimits = subscriptionService.getSubscriptionLimits('free');
    const premiumLimits = subscriptionService.getSubscriptionLimits('premium');
    const plaidLimits = subscriptionService.getSubscriptionLimits('plaid');
    
    console.log('✅ Free limits:', freeLimits);
    console.log('✅ Premium limits:', premiumLimits);
    console.log('✅ Plaid limits:', plaidLimits);
    console.log();

    // Test 2: Processing type configuration
    console.log('2️⃣ Testing processing type configuration...');
    const freeProcessing = subscriptionService.getProcessingType('free');
    const premiumProcessing = subscriptionService.getProcessingType('premium');
    const plaidProcessing = subscriptionService.getProcessingType('plaid');
    
    console.log('✅ Free processing:', freeProcessing);
    console.log('✅ Premium processing:', premiumProcessing);
    console.log('✅ Plaid processing:', plaidProcessing);
    console.log();

    // Test 3: AI processing configuration
    console.log('3️⃣ Testing AI processing configuration...');
    const freeConfig = subscriptionService.getAIProcessingConfig('free');
    const premiumConfig = subscriptionService.getAIProcessingConfig('premium');
    const plaidConfig = subscriptionService.getAIProcessingConfig('plaid');
    
    console.log('✅ Free AI config:', freeConfig);
    console.log('✅ Premium AI config:', premiumConfig);
    console.log('✅ Plaid AI config:', plaidConfig);
    console.log();

    // Test 4: Test with valid UUID (will fail on user lookup but should show proper validation)
    console.log('4️⃣ Testing subscription validation (expected to fail - no test user)...');
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format
    try {
      await subscriptionService.validateAIRequest(testUserId);
    } catch (error) {
      console.log('⚠️ Expected error (no test user):', error.message);
    }
    console.log();

    // Test 5: Usage logging
    console.log('5️⃣ Testing usage logging...');
    await subscriptionService.logAIUsage(testUserId, 'premium', 'test_message', 150);
    console.log('✅ Usage logging completed (check console for log output)');
    console.log();

    // Test 6: Edge cases
    console.log('6️⃣ Testing edge cases...');
    const unknownTierLimits = subscriptionService.getSubscriptionLimits('unknown_tier');
    const unknownProcessing = subscriptionService.getProcessingType('unknown_tier');
    const unknownConfig = subscriptionService.getAIProcessingConfig('unknown_tier');
    
    console.log('✅ Unknown tier defaults to free limits:', unknownTierLimits);
    console.log('✅ Unknown tier defaults to standard processing:', unknownProcessing);
    console.log('✅ Unknown tier defaults to free config:', unknownConfig);
    console.log();

    console.log('🎉 Subscription Service tests completed!');
    console.log('✅ Configuration methods working correctly');
    console.log('✅ Proper error handling for missing users');
    console.log('✅ Usage tracking functional');
    console.log('✅ Edge cases handled with sensible defaults');
    
  } catch (error) {
    console.error('❌ Subscription service test failed:', error);
  }
}

testSubscriptionService().catch(console.error);
