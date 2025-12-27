# TutorLink

A peer-to-peer tutoring platform connecting Howard University students with verified tutors at Howard University(with the potential to expand to other schools if deployed). TutorLink enables students to find tutors who excelled in their exact courses, request help, and schedule sessions seamlessly.

## 🎯 Features

### For Students
- **Browse Tutors**: Search for tutors by subject, course, or availability
- **Verified Tutors**: View tutors with verified academic transcripts
- **Request Help**: Send help requests to tutors with subject and preferred times
- **Track Requests**: Monitor the status of your help requests (pending, accepted, declined)
- **Schedule Sessions**: Access tutor scheduling links after request acceptance
- **Profile Management**: Update your student profile information

### For Tutors
- **Profile Setup**: Create a comprehensive tutor profile with bio, subjects, and availability
- **Help Requests**: View and respond to student help requests
- **Verification**: Upload transcripts for AI-powered verification
- **Scheduling**: Add your scheduling link (Calendly, etc.) for easy session booking
- **Multi-Role Support**: Switch between student and tutor roles seamlessly

### Platform Features
- **Multi-Role Support**: Users can be both students and tutors
- **Role Switching**: Easy switching between student and tutor views
- **Dark/Light Mode**: Theme toggle for better user experience
- **Responsive Design**: Mobile-friendly interface with hamburger menu
- **Email Verification**: Secure email verification for new accounts
- **Password Reset**: Forgot password functionality with email recovery

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **Supabase JS** - Authentication and database client
- **Axios** - HTTP client for API requests

### Backend
- **FastAPI** - Python web framework
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **OpenAI API** - AI-powered transcript verification
- **PyMuPDF** - PDF processing for transcript uploads
- **Uvicorn** - ASGI server

### Database
- **PostgreSQL** (via Supabase)
- Row Level Security (RLS) policies
- Multi-role support with array fields

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Supabase Account**
- **OpenAI API Key** (optional, for transcript verification)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tutorlink
   ```

2. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL from `supabase-schema.sql`

3. **Set up the backend**
   ```bash
   cd api
   pip install -r requirements.txt
   ```

4. **Set up the frontend**
   ```bash
   cd web
   npm install
   ```

### Environment Variables

#### Backend (`api/.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key  # Optional
```

#### Frontend (`web/.env`)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000  # Backend API URL
```

### Running the Application

1. **Start the backend API**
   ```bash
   cd api
   uvicorn main:app --reload --port 8000
   ```

2. **Start the frontend dev server**
   ```bash
   cd web
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📚 API Endpoints

### Authentication
- Authentication is handled by Supabase (not the FastAPI backend)
- JWT tokens are verified on protected endpoints

### Tutor Endpoints
- `GET /tutors/{tutor_id}` - Get tutor profile
- `GET /tutors/search` - Search tutors by subject/availability
- `POST /tutors/profile` - Create/update tutor profile
- `POST /tutors/transcript` - Upload transcript for verification

### Help Request Endpoints
- `GET /help-requests` - List help requests (as student or tutor)
- `POST /help-requests` - Create a new help request
- `PATCH /help-requests/{request_id}` - Update request status
- `GET /help-requests/{request_id}/contact` - Get contact info (after acceptance)

## 🗄️ Database Schema

### Key Tables
- **profiles** - User profiles with multi-role support
- **tutor_profiles** - Tutor-specific information
- **help_requests** - Student help requests
- **transcript_verifications** - Transcript verification records

See `supabase-schema.sql` for complete schema definition.

## 🎨 Key Features Implementation

### Multi-Role Support
- Users can have both `student` and `tutor` roles
- `active_role` field determines current view
- Role switcher component allows easy switching
- Dashboard adapts based on active role

### Responsive Design
- Mobile-first approach
- Hamburger menu for mobile navigation
- Responsive cards and layouts
- Touch-friendly interactions

### Authentication Flow
- Email/password authentication via Supabase
- Email verification required
- Password reset via email
- Protected routes with role-based access

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway, Render, or similar)
1. Connect your repository
2. Set environment variables
3. Install dependencies: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Database
- Supabase handles database hosting automatically
- No additional setup required

---

                                    Built with ❤️ for students
