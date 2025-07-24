import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migration to add Gmail integration fields to tasks table
 */
async function runMigration() {
  try {
    console.log('Starting Gmail integration migration...');
    
    // Read the SQL migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/add_gmail_integration_fields.sql'),
      'utf8'
    );
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Gmail integration migration completed successfully');
    console.log('   - Added gmail_integration_enabled column');
    console.log('   - Added gmail_scope_granted column');
    console.log('   - Added gmail_last_sync column');
    console.log('   - Created performance indexes');
    console.log('   - Updated existing tasks with default values');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration was successful
 */
async function verifyMigration() {
  try {
    console.log('Verifying migration...');
    
    // Check if columns exist
    const { rows } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name IN ('gmail_integration_enabled', 'gmail_scope_granted', 'gmail_last_sync')
      ORDER BY column_name;
    `);
    
    if (rows.length === 3) {
      console.log('✅ All Gmail integration columns verified:');
      rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
      });
    } else {
      throw new Error(`Expected 3 columns, found ${rows.length}`);
    }
    
    // Check indexes
    const indexQuery = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'tasks' 
      AND indexname LIKE '%gmail%';
    `);
    
    console.log(`✅ Gmail integration indexes created: ${indexQuery.rows.length}`);
    indexQuery.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
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
    await runMigration();
    await verifyMigration();
    
    console.log('\n🎉 Gmail integration database migration completed successfully!');
    console.log('   Tasks table is now ready for per-task Gmail integration.');
    
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

export { runMigration, verifyMigration };
