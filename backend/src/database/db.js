const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
 connectionString: process.env.DATABASE_URL || 'postgresql://postgres:CDsKWjSQw%234c5du@127.0.0.1:5432/calendar_organizer'
});

const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      institution VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createCoursesTable = `
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      course_code VARCHAR(50),
      semester VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      finals_week_start DATE,
      canvas_course_id VARCHAR(100),
      color VARCHAR(7) DEFAULT '#2563EB',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createMeetingTimesTable = `
    CREATE TABLE IF NOT EXISTS meeting_times (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      day_of_week VARCHAR(20) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL
    );
  `;

  const createTopicsTable = `
    CREATE TABLE IF NOT EXISTS topics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      sessions_needed INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createTopicPrerequisitesTable = `
    CREATE TABLE IF NOT EXISTS topic_prerequisites (
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      prerequisite_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      PRIMARY KEY (topic_id, prerequisite_id)
    );
  `;

  const createTopicSessionsTable = `
    CREATE TABLE IF NOT EXISTS topic_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      scheduled_date DATE NOT NULL,
      session_number INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled'
    );
  `;

  const createAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      due_date TIMESTAMP NOT NULL,
      original_due_date TIMESTAMP,
      weight INTEGER NOT NULL,
      min_prep_days INTEGER DEFAULT 7,
      canvas_assignment_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createAssignmentTopicsTable = `
    CREATE TABLE IF NOT EXISTS assignment_topics (
      assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      PRIMARY KEY (assignment_id, topic_id)
    );
  `;

  const createDisruptionsTable = `
    CREATE TABLE IF NOT EXISTS disruptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      disruption_date DATE NOT NULL,
      reason VARCHAR(255) NOT NULL,
      notes TEXT,
      announced_date DATE NOT NULL,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createScheduleVersionsTable = `
    CREATE TABLE IF NOT EXISTS schedule_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      disruption_id UUID REFERENCES disruptions(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      strategy_name VARCHAR(100) NOT NULL,
      schedule_data JSONB NOT NULL,
      score DECIMAL(5,2),
      pros TEXT[],
      cons TEXT[],
      applied BOOLEAN DEFAULT FALSE,
      applied_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createChangeLogsTable = `
    CREATE TABLE IF NOT EXISTS change_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      schedule_version_id UUID REFERENCES schedule_versions(id),
      change_type VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
    CREATE INDEX IF NOT EXISTS idx_topics_course ON topics(course_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
    CREATE INDEX IF NOT EXISTS idx_topic_sessions_date ON topic_sessions(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_disruptions_course ON disruptions(course_id);
  `;

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await pool.query(createUsersTable);
    await pool.query(createCoursesTable);
    await pool.query(createMeetingTimesTable);
    await pool.query(createTopicsTable);
    await pool.query(createTopicPrerequisitesTable);
    await pool.query(createTopicSessionsTable);
    await pool.query(createAssignmentsTable);
    await pool.query(createAssignmentTopicsTable);
    await pool.query(createDisruptionsTable);
    await pool.query(createScheduleVersionsTable);
    await pool.query(createChangeLogsTable);
    await pool.query(createIndexes);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

module.exports = {
  pool,
  createTables
};
