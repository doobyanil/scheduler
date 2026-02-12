# PostgreSQL Setup Guide for Windows

This guide will help you install and configure PostgreSQL on Windows for the Academic Calendar Organizer project.

## Step 1: Download and Install PostgreSQL

1. Visit the PostgreSQL download page: https://www.postgresql.org/download/windows/

2. Download the latest stable version (PostgreSQL 15 or higher recommended)

3. Run the installer and follow these steps:
   - **Installation Directory:** Keep the default (e.g., `C:\Program Files\PostgreSQL\15`)
   - **Data Directory:** Keep the default
   - **Password:** Set a password for the `postgres` user (remember this password!)
     - Default password used in this project: `postgres`
   - **Port:** Keep the default `5432`
   - **Locale:** Keep the default
   - **Components:** Make sure to select:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4 (optional but recommended)
     - ✅ Command Line Tools
     - ✅ Stack Builder (optional)

4. Complete the installation

## Step 2: Verify PostgreSQL Installation

### Option 1: Using Windows Services

1. Press `Win + R`, type `services.msc`, and press Enter
2. Look for a service named `postgresql-x64-15` (the number may vary based on version)
3. Check if the status is "Running"
4. If not running, right-click and select "Start"

### Option 2: Using Command Prompt

```cmd
sc query postgresql-x64-15
```

If the service is not running, start it with:

```cmd
net start postgresql-x64-15
```

### Option 3: Using pgAdmin

1. Open pgAdmin from your Start menu
2. You should see your PostgreSQL server listed
3. If it shows a red "X", right-click and select "Connect"

## Step 3: Create the Database

### Option 1: Using Command Line

Open Command Prompt as Administrator and run:

```cmd
createdb -U postgres calendar_organizer
```

You'll be prompted for the postgres user password (the one you set during installation).

### Option 2: Using psql Interactive Shell

```cmd
psql -U postgres
```

Enter your password when prompted, then run:

```sql
CREATE DATABASE calendar_organizer;
\q
```

### Option 3: Using pgAdmin

1. Open pgAdmin
2. Expand your server in the left panel
3. Right-click on "Databases" → "Create" → "Database..."
4. Name it `calendar_organizer`
5. Click "Save"

## Step 4: Verify Database Creation

```cmd
psql -U postgres -l
```

You should see `calendar_organizer` in the list of databases.

## Step 5: Configure Environment Variables (if needed)

The project's `backend/.env` file is already configured with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/calendar_organizer
```

If you used a different password during installation, update this line:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/calendar_organizer
```

**Quick Update (Windows):**
You can use the provided helper script:
```cmd
update-password.bat
```

This will prompt you for your PostgreSQL password and update the `.env` file automatically.

**Manual Update:**
1. Open `backend/.env` in a text editor
2. Find the line starting with `DATABASE_URL`
3. Replace the password (the second `postgres` in the URL) with your actual password
4. Save the file

## Step 6: Run Database Migrations

```cmd
cd backend
npm run migrate
```

This will create all necessary tables in the database.

## Troubleshooting

### "psql is not recognized as an internal or external command"

**Solution:** Add PostgreSQL bin directory to your PATH:

1. Press `Win + R`, type `sysdm.cpl`, and press Enter
2. Go to the "Advanced" tab and click "Environment Variables"
3. Under "System variables", find "Path" and click "Edit"
4. Click "New" and add: `C:\Program Files\PostgreSQL\15\bin`
5. Click "OK" on all dialogs
6. Restart Command Prompt

### "Connection refused" or "could not connect to server"

**Solution:** Check if PostgreSQL is running:

```cmd
sc query postgresql-x64-15
```

If it's not running, start it:

```cmd
net start postgresql-x64-15
```

["RESET_PASSWORD_GUIDE.md](RESET_PASSWORD_GUIDE.md) for detailed instructions\n\n**Manual Reset:**\n1. Open `pg_hba.conf` (usually in `C:Program FilesPostgreSQL15data`)\n2. Change the authentication method for IPv4 local connections from `md5` to `trust`\n3. Restart the PostgreSQL service\n4. Connect without password and change it:\n   ```sql\n   ALTER USER postgres WITH PASSWORD 'new_password';\n   ```\n5. Change the authentication method back to `md5`\n6. Restart the PostgreSQL service again"]

### "database "calendar_organizer" already exists"

**Solution:** This is normal if you've already created the database. You can proceed with running migrations.

### Port 5432 is already in use

**Solution:** Another application might be using port 5432. You can:

1. Find what's using the port:
   ```cmd
   netstat -ano | findstr :5432
   ```

2. Either stop the conflicting application or change PostgreSQL's port in `postgresql.conf`

## Useful Commands

```cmd
# Start PostgreSQL service
net start postgresql-x64-15

# Stop PostgreSQL service
net stop postgresql-x64-15

# Connect to database
psql -U postgres -d calendar_organizer

# List all databases
psql -U postgres -l

# Backup database
pg_dump -U postgres calendar_organizer > backup.sql

# Restore database
psql -U postgres calendar_organizer < backup.sql

# Delete database (WARNING: This will delete all data!)
psql -U postgres
DROP DATABASE calendar_organizer;
```

## Next Steps

Once PostgreSQL is installed and configured:

1. Run the development servers:
   ```cmd
   start-dev.bat
   ```

2. Or start manually:
   ```cmd
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. Access the application at http://localhost:3000

## Additional Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pgAdmin Documentation: https://www.pgadmin.org/docs/
- Project Setup Guide: See [SETUP.md](SETUP.md) for more details