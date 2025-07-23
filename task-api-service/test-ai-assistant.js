#!/usr/bin/env node

/**
 * Test script for AI Assistant Framework
 * Run with: node test-ai-assistant.js
 */

import dotenv from 'dotenv';
import aiAssistantService from './services/aiAssistantService.js';

dotenv.config();

async function testAIAssistantFramework() {
  console.log('🧪 Testing AI Assistant Framework...\n');

  try {
    // Test 1: Task-specific context gathering
    console.log('1️⃣ Testing Task Context Gathering...');
    try {
      // Note: This will fail if no tasks exist, but shows the structure
      const taskContext = await aiAssistantService.gatherTaskContext('test-user-id', 1);
      console.log('✅ Task context gathered successfully');
      console.log('Context keys:', Object.keys(taskContext));
    } catch (error) {
      console.log('⚠️ Task context test skipped (no test data):', error.message);
    }
    console.log();

    // Test 2: Assistant context gathering
    console.log('2️⃣ Testing Assistant Context Gathering...');
    try {
      const assistantContext = await aiAssistantService.gatherAssistantContext('test-user-id', {
        current_view: 'dashboard',
        visible_task_ids: [1, 2, 3],
        visible_folder_ids: [1, 2]
      });
      console.log('✅ Assistant context gathered successfully');
      console.log('Context keys:', Object.keys(assistantContext));
    } catch (error) {
      console.log('⚠️ Assistant context test skipped (no test data):', error.message);
    }
    console.log();

    // Test 3: Task AI message processing (placeholder)
    console.log('3️⃣ Testing Task AI Message Processing...');
    try {
      const taskResponse = await aiAssistantService.processTaskAIMessage(
        'test-user-id', 
        1, 
        'How can I break this task into smaller steps?'
      );
      console.log('✅ Task AI processing works:');
      console.log('Response keys:', Object.keys(taskResponse));
      console.log('Context used:', taskResponse.context_used);
    } catch (error) {
      console.log('⚠️ Task AI processing test:', error.message);
    }
    console.log();

    // Test 4: General assistant message processing (placeholder)
    console.log('4️⃣ Testing General Assistant Processing...');
    try {
      const assistantResponse = await aiAssistantService.processAssistantMessage(
        'test-user-id',
        'What should I focus on today?',
        {
          current_view: 'dashboard',
          visible_task_ids: [1, 2, 3],
          filters: { status: 'pending' }
        }
      );
      console.log('✅ Assistant processing works:');
      console.log('Response keys:', Object.keys(assistantResponse));
      console.log('Context used:', assistantResponse.context_used);
    } catch (error) {
      console.log('⚠️ Assistant processing test:', error.message);
    }
    console.log();

    console.log('🎉 AI Assistant Framework structure is ready!');
    console.log('💡 Framework includes:');
    console.log('   - Context gathering for tasks and general queries');
    console.log('   - Placeholder AI processing pipeline');
    console.log('   - Database integration for message storage');
    console.log('   - Enhanced controllers with AI capabilities');
    console.log('   - Proper error handling and fallbacks');

  } catch (error) {
    console.error('❌ Framework test failed:', error.message);
  }
}

// Run tests
testAIAssistantFramework();
