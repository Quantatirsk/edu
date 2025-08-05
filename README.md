# 优教通 (YouJiaoTong) - Extra-curricular Tutoring Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)

A comprehensive full-stack web platform designed to streamline extra-curricular tutoring management, connecting students with qualified teachers for personalized one-on-one instruction.

## 🎯 Project Overview

**优教通** (YouJiaoTong) is a modern tutoring management platform that facilitates the entire tutoring workflow from teacher discovery to lesson completion and performance tracking. The platform serves three main user types:

- **Students**: Browse teachers, book appointments, track progress
- **Teachers**: Manage schedules, view student analytics, handle appointments  
- **Administrators**: Oversee platform operations and analytics

## ✨ Key Features

### 🔍 Teacher Discovery & Booking
- **Smart Search**: Filter teachers by subject, price range, location, and ratings
- **Detailed Profiles**: View teacher qualifications, experience, teaching style, and reviews
- **Flexible Scheduling**: Book single lessons or lesson packages with real-time availability
- **Geolocation Support**: Find nearby teachers with map integration

### 📅 Appointment Management
- **Real-time Booking**: Instant appointment confirmation system
- **Status Tracking**: Monitor appointment lifecycle (pending → confirmed → completed)
- **Rescheduling**: Easy appointment modification and cancellation
- **Multi-format Support**: Single lessons and lesson package management

### ⭐ Review & Rating System
- **Comprehensive Reviews**: Multi-dimensional ratings (teaching, patience, communication, effectiveness)
- **Verified Feedback**: Only completed lesson participants can leave reviews
- **Teacher Analytics**: Detailed performance metrics and improvement tracking

### 📊 Performance Analytics
- **Student Progress**: Track score improvements across subjects and time periods
- **Teacher Insights**: View teaching effectiveness and student success rates
- **Data Visualization**: Interactive charts and performance dashboards

### 🔐 Authentication & Security
- **Role-based Access**: Secure authentication with role-specific permissions
- **Data Protection**: Encrypted password storage and secure API endpoints
- **Session Management**: JWT-based authentication with refresh tokens

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: Zustand for global state, React Query for server state
- **Routing**: React Router with lazy loading and code splitting
- **Performance**: Optimized with memo, useMemo, and dynamic imports

### Backend Stack
- **Framework**: FastAPI (Python) with automatic OpenAPI documentation
- **Database**: SQLite for development (easily migrated to PostgreSQL/MySQL)
- **ORM**: SQLAlchemy with Pydantic models for type safety
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Design**: RESTful APIs with comprehensive error handling

### Development Tools
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Vitest for unit tests, React Testing Library for component tests
- **Development**: Hot reload, concurrent development servers
- **Build**: Optimized production builds with code splitting

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **Python** 3.9.0 or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Quantatirsk/edu.git
   cd edu
   ```

2. **Install all dependencies**
   ```bash
   npm run install
   ```
   This installs both frontend and backend dependencies automatically.

3. **Initialize the database**
   ```bash
   cd backend
   python init_db.py
   python init_sample_data.py
   ```

4. **Start development servers**
   ```bash
   # From project root - starts both frontend and backend
   npm run dev
   
   # Or use the quick start script
   npm run dev:quick
   
   # Windows users
   npm run dev:win
   ```

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Alternative Manual Start

```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📁 Project Structure

```
edu/
├── frontend/                    # React/TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base UI components (shadcn/ui)
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── layout/        # Layout components
│   │   │   └── forms/         # Form components
│   │   ├── pages/             # Route-level page components
│   │   ├── stores/            # Zustand state management
│   │   ├── services/          # API service layer
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── router/            # Routing configuration
│   ├── public/                # Static assets
│   └── docs/                  # Frontend documentation
├── backend/                    # FastAPI/Python backend
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   ├── core/              # Core utilities (auth, config)
│   │   ├── db/                # Database operations (CRUD)
│   │   └── models/            # Data models and schemas
│   ├── init_*.py              # Database initialization scripts
│   └── requirements.txt       # Python dependencies
├── package.json               # Project-level scripts and config
├── start-dev.sh              # Development startup script (Unix)
├── start-dev.bat             # Development startup script (Windows)
└── README.md                 # This file
```

## 🔧 Available Scripts

### Project Level
```bash
npm run dev              # Start both frontend and backend
npm run dev:quick        # Quick start with dev.sh script
npm run dev:win          # Windows development start
npm run install          # Install all dependencies
npm run build            # Build frontend for production
npm run test             # Run frontend tests
npm run clean            # Clean all build artifacts
npm run kill-ports       # Kill development servers on ports 5173, 8000
```

### Frontend Only
```bash
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
```

### Backend Only
```bash
cd backend
python main.py           # Start FastAPI server
python init_db.py        # Initialize database schema
python init_sample_data.py  # Populate with sample data
python view_sample_data.py  # View current data
```

## 🗄️ Database Schema

The platform uses a comprehensive database schema supporting:

- **Users**: Students, teachers, and administrators with role-based permissions
- **Teachers**: Extended profiles with subjects, experience, pricing, and location data
- **Appointments**: Flexible booking system supporting single lessons and packages
- **Reviews**: Multi-dimensional rating system with detailed feedback
- **Analytics**: Score tracking and performance metrics

Key models include:
- `User`, `Teacher`, `Student` - User management
- `Appointment` - Booking and scheduling  
- `Review` - Rating and feedback system
- `ScoreRecord` - Academic progress tracking

## 🌟 Core Functionality

### Student Experience
1. **Discover Teachers**: Browse and filter qualified instructors
2. **View Profiles**: Review teacher qualifications, experience, and student feedback
3. **Book Lessons**: Schedule convenient appointment times
4. **Track Progress**: Monitor academic improvement over time
5. **Leave Reviews**: Share feedback to help other students

### Teacher Experience  
1. **Manage Profile**: Showcase qualifications and teaching approach
2. **Set Availability**: Control when appointments can be booked
3. **View Bookings**: Track upcoming and past lessons
4. **Monitor Analytics**: See student progress and teaching effectiveness
5. **Handle Reviews**: Respond to student feedback

### Admin Experience
1. **Platform Overview**: Monitor user activity and system health
2. **User Management**: Oversee student and teacher accounts
3. **Content Moderation**: Review and moderate user-generated content
4. **Analytics Dashboard**: Track platform performance and growth metrics

## 🔐 Authentication System

The platform implements a secure authentication system with:

- **JWT Tokens**: Secure, stateless authentication
- **Role-based Access**: Different permissions for students, teachers, and admins
- **Password Security**: bcrypt hashing with strong password requirements
- **Session Management**: Refresh tokens for extended sessions
- **Protected Routes**: Frontend route guards based on authentication status

## 🎨 UI/UX Design

Built with modern design principles:

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessible**: WCAG compliant with keyboard navigation and screen reader support
- **Component Library**: Consistent UI with shadcn/ui and Radix primitives
- **Dark Mode Ready**: Theme system supporting light/dark modes
- **Performance Optimized**: Lazy loading, code splitting, and optimized renders

## 🧪 Testing Strategy

Comprehensive testing approach:

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API endpoints and user workflows  
- **Type Safety**: Full TypeScript coverage with strict mode
- **Code Quality**: ESLint and Prettier for consistent code style

## 🚀 Deployment

The platform is designed for easy deployment:

- **Frontend**: Static build suitable for CDN deployment (Vercel, Netlify)
- **Backend**: Containerizable FastAPI application
- **Database**: SQLite for development, easily migrated to PostgreSQL/MySQL for production
- **Environment Configuration**: Comprehensive environment variable support

## 🤝 Contributing

We welcome contributions! Please see our development workflow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation for API changes
- Ensure TypeScript type safety
- Test across different screen sizes and browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the excellent frontend framework
- **FastAPI** for the high-performance backend framework
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first styling approach
- **Radix UI** for accessible component primitives

## 📞 Support

For questions, issues, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/Quantatirsk/edu/issues)
- **Discussions**: [Join our discussions](https://github.com/Quantatirsk/edu/discussions)

---

**优教通** - Connecting great teachers with motivated students for better educational outcomes. 🎓✨