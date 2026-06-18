# FirstCry Intellitots - Parent Meeting Scheduler

A modern full-stack web application designed for a preschool organization called **FirstCry Intellitots**. The platform is used daily by Parents, Teachers, and Admin/Centre Heads to seamlessly manage, schedule, track, and complete parent-teacher meetings.

---

## 🚀 Key Features

*   **Role-Based Access Control & Dashboards**:
    *   **Parents**: Request meetings, view upcoming/confirmed meetings, track request histories, and cancel pending requests.
    *   **Teachers**: Manage daily schedules, view pending requests (approve, reject, or reschedule with custom date/time and notes), and add session notes to mark meetings as Completed.
    *   **Admin / Centre Head**: Monitor full preschool schedules with analytics cards, filter meetings by teacher, status, and date, search parent/student records, and reassign teachers dynamically.
*   **Dual-Mode Database Fallback**: If a local MySQL server is not detected, the backend dynamically falls back to an **In-Memory SQL Mock Driver** loaded with seed data. This allows the application to be tested immediately without database configuration!
*   **Unified Sign-In**: Parents, Teachers, and Admins can log in from a single sleek portal using their email addresses or Teacher IDs.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), React Router, Tailwind CSS, Axios, Lucide Icons
*   **Backend**: Node.js, Express.js, JWT Authentication, Bcryptjs
*   **Database**: MySQL (using `mysql2` pool) with automatic In-Memory fallback

---

## 📁 Project Structure

```text
internship/
├── backend/
│   ├── config/
│   │   └── db.js            # Dual-mode database loader (MySQL / In-Memory Mock)
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   └── meetingController.js
│   ├── db/
│   │   └── schema.sql       # MySQL Database schemas
│   ├── middleware/
│   │   └── auth.js          # JWT Role checking middleware
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── meetings.js
│   │   └── teachers.js
│   ├── scripts/
│   │   └── dbSetup.js       # Script to create DB, tables, and hash seed data
│   ├── .env                 # Server configurations
│   ├── package.json
│   └── server.js            # Main backend server
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── DashboardLayout.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx
    │   │   ├── BookMeeting.jsx
    │   │   ├── Login.jsx
    │   │   ├── ParentDashboard.jsx
    │   │   └── TeacherDashboard.jsx
    │   ├── services/
    │   │   └── api.js        # Axios api wrapper
    │   ├── App.jsx           # Client routes
    │   ├── index.css         # Tailwind global styles
    │   └── main.jsx
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── package.json
```

---

## 🔧 Installation & Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (version >= 18) installed.

### 2. Configure Backend
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment configurations in `.env` (optional, default root credentials will work):
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=firstcry_intellitots_meetings
    JWT_SECRET=firstcry_intellitots_secret_key_2026
    JWT_EXPIRES_IN=7d
    ```
4.  *(Optional)* If MySQL is running on your machine, initialize the database tables and seed records:
    ```bash
    npm run db:setup
    ```
    *If MySQL is not running, the backend will automatically launch in In-Memory Demo Mode.*
5.  Start the backend server:
    ```bash
    npm start
    ```
    The backend runs on: **`http://localhost:5000/`**

### 3. Configure Frontend
1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies (React Router, Axios, Tailwind, Lucide):
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Launch the Vite developer client:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to: **`http://localhost:5173/`**

---

## 🔑 Demo Account Credentials

Use the following credentials to explore the dashboards:

| Role | Email / ID | Password | Actions / Access |
| :--- | :--- | :--- | :--- |
| **Parent 1** | `ramesh@gmail.com` | `password123` | Book, cancel, view meeting statuses for child |
| **Parent 2** | `priya@gmail.com` | `password123` | Book, cancel, view meeting statuses for child |
| **Teacher 1** | `shalini@intellitots.com` *or* `TCH2` | `password123` | Approve, reject, reschedule, write notes |
| **Teacher 2** | `ananya@intellitots.com` *or* `TCH3` | `password123` | Approve, reject, reschedule, write notes |
| **Admin** | `admin@intellitots.com` | `password123` | Global analytics, filters, assign teachers |

---

## 🛡️ Deployment Checklist (Render/Vercel)

1.  **Backend (Render)**:
    *   Deploy as a **Web Service**.
    *   Build Command: `npm install`
    *   Start Command: `node server.js`
    *   Set Environment variables matching `.env` on Render Dashboard.
2.  **Frontend (Render/Vercel)**:
    *   Deploy as a **Static Site**.
    *   Build Command: `npm run build`
    *   Publish Directory: `dist`
    *   Change the `API_URL` variable in `frontend/src/services/api.js` to point to the production backend service URL.
