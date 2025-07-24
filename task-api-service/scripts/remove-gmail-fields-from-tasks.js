import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Remove Gmail fields from tasks table since Gmail integration is now global
 */
async function removeGmailFieldsFromTasks() {
  try {
    console.log('Removing Gmail fields from tasks table...');
    
    // Read the SQL migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/remove_gmail_fields_from_tasks.sql'),
      'utf8'
    );
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Gmail fields removal completed successfully');
    console.log('   - Removed gmail_integration_enabled column');
    console.log('   - Removed gmail_scope_granted column');
    console.log('   - Removed gmail_last_sync column');
    console.log('   - Dropped related indexes');
    console.log('   - Gmail integration is now handled globally via integrations table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration was successful
 */
async function verifyGmailFieldsRemoval() {
  try {
    console.log('Verifying Gmail fields removal...');
    
    // Check that Gmail columns no longer exist
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name IN ('gmail_integration_enabled', 'gmail_scope_granted', 'gmail_last_sync');
    `);
    
    if (rows.length === 0) {
      console.log('✅ All Gmail columns successfully removed from tasks table');
    } else {
      throw new Error(`Gmail columns still exist: ${rows.map(r => r.column_name).join(', ')}`);
    }
    
    // Check that integrations table still has gmail column
    const integrationsCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'integrations' 
      AND column_name = 'gmail';
    `);
    
    if (integrationsCheck.rows.length > 0) {
      console.log('✅ Gmail integration column confirmed in integrations table');
    } else {
      console.log('⚠️  Warning: Gmail column not found in integrations table');
    }
    
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
    await removeGmailFieldsFromTasks();
    await verifyGmailFieldsRemoval();
    
    console.log('\n🎉 Gmail fields removal migration completed successfully!');
    console.log('   Gmail integration is now managed globally through the integrations table.');
    console.log('   Use /api/v1/integrations/gmail/* endpoints for Gmail functionality.');
    
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

export { removeGmailFieldsFromTasks, verifyGmailFieldsRemoval };
