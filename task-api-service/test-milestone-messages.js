import milestoneService from './services/milestoneService.js';

/**
 * Test the milestone message generation for different subscription tiers
 */
async function testMilestoneMessages() {
  console.log('🧪 Testing Milestone Message Generation...\n');
  
  try {
    const testScenarios = [
      { tier: 'free', completedTasks: 100 },
      { tier: 'premium', completedTasks: 100 },
      { tier: 'plaid', completedTasks: 100 }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`--- Testing ${scenario.tier.toUpperCase()} Tier Milestone ---`);
      
      const milestone = milestoneService.getUpgradeMessage(scenario.tier, scenario.completedTasks);
      
      console.log(`🎉 Title: ${milestone.title}`);
      console.log(`📝 Message: ${milestone.message}`);
      console.log(`📊 Current Tier: ${milestone.current_tier}`);
      console.log(`⬆️  Suggested Tier: ${milestone.suggested_tier || 'None'}`);
      console.log(`🎯 CTA: ${milestone.cta_text}`);
      console.log(`✨ Benefits:`);
      milestone.benefits.forEach(benefit => {
        console.log(`   - ${benefit}`);
      });
      console.log(`🔗 Action: ${milestone.cta_action}`);
      console.log('');
    }
    
    // Test milestone table creation
    console.log('🗄️  Testing milestone table auto-creation...');
    try {
      await milestoneService.createMilestonesTable();
      console.log('✅ Milestone table creation successful');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Milestone table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 Milestone message generation test completed successfully!');
    console.log('\nThe system will show these messages when users complete 100 tasks:');
    console.log('✅ Free users: Encouraged to upgrade to Premium');
    console.log('✅ Premium users: Encouraged to upgrade to Plaid');
    console.log('✅ Plaid users: Congratulated for their achievement');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Main test runner
 */
async function main() {
  try {
    await testMilestoneMessages();
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
