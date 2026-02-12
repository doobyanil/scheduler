const { pool, createTables } = require('./db');

const migrate = async () => {
  console.log('Starting database migration...');
  
  try {
    await createTables();
    console.log('Database migration completed successfully');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
