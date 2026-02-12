# Academic Calendar Organizer

An intelligent academic calendar management system that helps professors reschedule courses when unexpected disruptions occur.

## Features

- 📚 Course management with topics and assignments
- 🤖 Intelligent rescheduling using constraint satisfaction algorithms
- 📧 Automatic email notifications
- 📅 Calendar export (PDF, CSV, .ics)
- 🎓 Canvas LMS integration
- 📄 Syllabus import (PDF/Word parsing)
- 📊 Schedule optimization with scoring system

## Quick Start

**Prerequisites:** Node.js 18+, PostgreSQL 15+

### First-Time Setup

If you don't have PostgreSQL installed yet:

**Windows users:** See [POSTGRESQL_SETUP_WINDOWS.md](POSTGRESQL_SETUP_WINDOWS.md) for detailed installation instructions.

**macOS/Linux users:** See [SETUP.md](SETUP.md) for installation instructions.

### Option 1: Using Start Scripts (Recommended)

**Windows:**
```bash
# Double-click start-dev.bat or run from command line
start-dev.bat
```

**macOS/Linux:**
```bash
# Make script executable (first time only)
chmod +x start-dev.sh

# Run the script
./start-dev.sh
```

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Create PostgreSQL database:**
   ```bash
   createdb calendar_organizer
   ```

3. **Run migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start servers (in separate terminals):**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

5. **Access the app:** http://localhost:3000

📖 **For detailed setup instructions, see [SETUP.md](SETUP.md).**

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Query
- React Hook Form
- Recharts

### Backend
- Node.js + Express
- PostgreSQL
- JWT authentication
- SendGrid (email)
- Anthropic Claude API (syllabus parsing)

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── api/
│   ├── package.json
│   └── Dockerfile
├── start-dev.bat                    # Windows startup script
├── start-dev.sh                     # macOS/Linux startup script
├── update-password.bat              # Helper to update PostgreSQL password in .env
├── reset-postgres-password.bat      # Helper to reset PostgreSQL password
├── SETUP.md                         # Detailed setup guide
├── POSTGRESQL_SETUP_WINDOWS.md      # PostgreSQL setup for Windows
├── RESET_PASSWORD_GUIDE.md          # PostgreSQL password reset guide
└── docker-compose.yml               # Docker setup (optional)
```

## API Documentation

API documentation is available at `/api/docs` (Swagger) when the backend is running.

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production mode
cd ../backend
npm start
```

## Troubleshooting

### PostgreSQL Connection Issues

If you encounter database connection errors:
1. Verify PostgreSQL is running
2. Check that the `calendar_organizer` database exists
3. Verify credentials in `backend/.env`

**Password Authentication Failed:**
If you see "FATAL: password authentication failed for user 'postgres'":
- The password in `backend/.env` doesn't match your PostgreSQL password
- **Windows users:** Run `update-password.bat` to update it automatically
- **Manual update:** Edit `backend/.env` and update the password in `DATABASE_URL`
- **Forgot password?** See [RESET_PASSWORD_GUIDE.md](RESET_PASSWORD_GUIDE.md) for reset instructions

**Windows users:** See [POSTGRESQL_SETUP_WINDOWS.md](POSTGRESQL_SETUP_WINDOWS.md) for detailed PostgreSQL troubleshooting.

### Port Already in Use

If ports 5000 or 3000 are in use:
- Change the port in `backend/.env` (for backend)
- Vite will automatically use the next available port (for frontend)

For more troubleshooting tips, see [SETUP.md](SETUP.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
