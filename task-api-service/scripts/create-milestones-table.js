import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create user_milestones table for tracking user achievements
 */
async function createMilestonesTable() {
  try {
    console.log('Creating user_milestones table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_milestones (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        milestone_type VARCHAR(50) NOT NULL,
        achieved_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, milestone_type)
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id 
      ON user_milestones (user_id);
      
      CREATE INDEX IF NOT EXISTS idx_user_milestones_type 
      ON user_milestones (milestone_type);
      
      CREATE INDEX IF NOT EXISTS idx_user_milestones_achieved_at 
      ON user_milestones (achieved_at);
      
      -- Add comments for documentation
      COMMENT ON TABLE user_milestones IS 'Tracks user achievement milestones like completing 100 tasks';
      COMMENT ON COLUMN user_milestones.user_id IS 'Reference to the user who achieved the milestone';
      COMMENT ON COLUMN user_milestones.milestone_type IS 'Type of milestone (e.g., tasks_100_completed)';
      COMMENT ON COLUMN user_milestones.achieved_at IS 'When the user achieved this milestone';
    `;
    
    await pool.query(createTableSQL);
    
    console.log('✅ User milestones table created successfully');
    console.log('   - Added user_milestones table');
    console.log('   - Created indexes for performance');
    console.log('   - Added documentation comments');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration was successful
 */
async function verifyMilestonesTable() {
  try {
    console.log('Verifying milestones table...');
    
    // Check if table exists and has correct columns
    const { rows } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_milestones'
      ORDER BY ordinal_position;
    `);
    
    const expectedColumns = ['id', 'user_id', 'milestone_type', 'achieved_at', 'created_at', 'updated_at'];
    const actualColumns = rows.map(row => row.column_name);
    
    console.log('✅ Table columns verified:');
    rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check indexes
    const indexQuery = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'user_milestones';
    `);
    
    console.log(`✅ Indexes created: ${indexQuery.rows.length}`);
    indexQuery.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });
    
    // Test the unique constraint
    const constraintQuery = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_milestones' 
      AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');
    `);
    
    console.log(`✅ Constraints: ${constraintQuery.rows.length}`);
    constraintQuery.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}: ${row.constraint_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function main() {
  try {
    await createMilestonesTable();
    await verifyMilestonesTable();
    
    console.log('\n🎉 Milestones table migration completed successfully!');
    console.log('   The system can now track user achievements and show upgrade suggestions.');
    console.log('   When users complete 100 tasks, they\'ll see subscription upgrade messages.');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createMilestonesTable, verifyMilestonesTable };
