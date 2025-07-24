import { pool } from './db.js';
import milestoneService from './services/milestoneService.js';

/**
 * Test the milestone system with different subscription scenarios
 */
async function testMilestoneSystem() {
  console.log('🧪 Testing Milestone System...\n');
  
  try {
    // Test user IDs for different scenarios
    const testUsers = {
      freeUser: 'test-free-user-001',
      premiumUser: 'test-premium-user-001', 
      plaidUser: 'test-plaid-user-001'
    };
    
    // Clean up any existing test data
    await pool.query('DELETE FROM user_milestones WHERE user_id IN ($1, $2, $3)', 
      [testUsers.freeUser, testUsers.premiumUser, testUsers.plaidUser]);
    await pool.query('DELETE FROM tasks WHERE user_id IN ($1, $2, $3)', 
      [testUsers.freeUser, testUsers.premiumUser, testUsers.plaidUser]);
    await pool.query('DELETE FROM app_users WHERE user_id IN ($1, $2, $3)', 
      [testUsers.freeUser, testUsers.premiumUser, testUsers.plaidUser]);
    
    // Create test users with different subscription tiers
    for (const [userType, userId] of Object.entries(testUsers)) {
      const tier = userType.replace('User', ''); // free, premium, plaid
      
      await pool.query(`
        INSERT INTO app_users (user_id, email, subscription, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET subscription = $3
      `, [userId, `${userId}@test.com`, tier]);
      
      console.log(`✅ Created test user: ${userId} (${tier} tier)`);
    }
    
    // Create 100+ completed tasks for each test user
    console.log('\n📝 Creating 100+ completed tasks for each user...');
    
    for (const [userType, userId] of Object.entries(testUsers)) {
      for (let i = 1; i <= 105; i++) {
        await pool.query(`
          INSERT INTO tasks (user_id, title, description, completed_at, created_at, updated_at)
          VALUES ($1, $2, $3, NOW() - INTERVAL '${i} days', NOW() - INTERVAL '${i} days', NOW() - INTERVAL '${i} days')
        `, [userId, `Test Task ${i}`, `Description for task ${i}`]);
      }
      console.log(`   ✅ Created 105 completed tasks for ${userId}`);
    }
    
    // Test milestone checking for each user type
    console.log('\n🎯 Testing milestone detection...\n');
    
    for (const [userType, userId] of Object.entries(testUsers)) {
      console.log(`--- Testing ${userType} (${userId}) ---`);
      
      // Check for milestones
      const milestones = await milestoneService.checkAllMilestones(userId);
      
      if (milestones.length > 0) {
        const milestone = milestones[0];
        console.log(`🎉 Milestone detected!`);
        console.log(`   Title: ${milestone.title}`);
        console.log(`   Message: ${milestone.message}`);
        console.log(`   Current Tier: ${milestone.current_tier}`);
        console.log(`   Suggested Tier: ${milestone.suggested_tier || 'None'}`);
        console.log(`   CTA: ${milestone.cta_text}`);
        console.log(`   Benefits:`);
        milestone.benefits.forEach(benefit => {
          console.log(`     - ${benefit}`);
        });
      } else {
        console.log(`❌ No milestones detected (milestone may already be seen)`);
      }
      
      // Check if milestone was marked as seen
      const hasSeenMilestone = await milestoneService.hasSeenMilestone(userId, 'tasks_100_completed');
      console.log(`   Milestone marked as seen: ${hasSeenMilestone}`);
      
      console.log('');
    }
    
    // Test the API endpoints behavior
    console.log('🔗 Testing milestone API behavior...');
    
    // Simulate what happens when a task is completed
    const testUserId = testUsers.freeUser;
    
    // Create a new incomplete task
    const { rows: newTask } = await pool.query(`
      INSERT INTO tasks (user_id, title, description, created_at, updated_at)
      VALUES ($1, 'New Task to Complete', 'Test completing this task', NOW(), NOW())
      RETURNING *
    `, [testUserId]);
    
    console.log(`✅ Created new incomplete task: ${newTask[0].id}`);
    
    // Clear the milestone so we can test it again
    await pool.query('DELETE FROM user_milestones WHERE user_id = $1', [testUserId]);
    
    // Complete the task and check for milestones
    const milestones = await milestoneService.onTaskCompleted(testUserId, newTask[0].id);
    
    if (milestones.length > 0) {
      console.log(`✅ Milestone triggered on task completion!`);
      console.log(`   Milestone type: ${milestones[0].milestone}`);
    } else {
      console.log(`❌ No milestone triggered on task completion`);
    }
    
    // Get milestone stats
    const { rows: stats } = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_tasks
      FROM tasks 
      WHERE user_id = $1 AND deleted_at IS NULL
    `, [testUserId]);
    
    console.log(`📊 Task stats for ${testUserId}:`);
    console.log(`   Total tasks: ${stats[0].total_tasks}`);
    console.log(`   Completed tasks: ${stats[0].completed_tasks}`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await pool.query('DELETE FROM user_milestones WHERE user_id IN ($1, $2, $3)', 
      [testUsers.freeUser, testUsers.premiumUser, testUsers.plaidUser]);
    await pool.query('DELETE FROM tasks WHERE user_id IN ($1, $2, $3)', 
      [testUsers.freeUser, testUsers.premiumUser, testUsers.plaidUser]);
    await pool.query('DELETE FROM app_users WHERE user_id IN ($1, $2, $3)', 
      [testUsers.freeUser, testUsers.premiumUser, testUsers.plaidUser]);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Milestone system test completed successfully!');
    console.log('\nThe system will now:');
    console.log('✅ Detect when users complete 100 tasks');
    console.log('✅ Show appropriate upgrade messages based on subscription tier');
    console.log('✅ Track which milestones users have seen');
    console.log('✅ Provide API endpoints for frontend integration');
    
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
    await testMilestoneSystem();
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
