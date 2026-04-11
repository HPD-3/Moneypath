#  Moneypath

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success"/>
  <img src="https://img.shields.io/badge/frontend-Firebase-orange"/>
  <img src="https://img.shields.io/badge/backend-Vercel-black"/>
  <img src="https://img.shields.io/badge/auth-Firebase-blue"/>
  <img src="https://img.shields.io/badge/license-MIT-green"/>
</p>

> A fullstack finance tracking web app using Firebase + Vercel serverless architecture.

\---

##  Live Demo

*  Deployed Version: [Link Here!](https://moneypath-7777.firebaseapp.com/)


\---

##  Screenshots

###  Dashboard

![Dashboard Screenshot](./src/assets/21.png)

###  Login

![Dashboard Screenshot](./src/assets/Login.png)

\---

##  Architecture

User → Firebase Hosting → Axios → Vercel API → Database

\---

##  Project Structure

front-end/
├── src/
├── public/
├── .env
├── firebase.json
└── server/
├── controllers/
├── middleware/
├── routes/
├── server.js
├── package.json
└── vercel.json

\---

##  Tech Stack

Frontend: React (Vite), Firebase Hosting, Axios, Tailwind CSS  
Backend: Node.js, Express, Vercel, Firebase Admin SDK  
Auth: Firebase Auth, Firebase Admin SDK  
Database: Firestore

\---

##  Dependencies

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **React** | ^19.2.0 | UI library |
| **React DOM** | ^19.2.0 | React DOM binding |
| **React Router DOM** | ^7.13.1 | Client-side routing |
| **Firebase** | ^12.10.0 | Authentication & Firestore |
| **Axios** | ^1.13.6 | HTTP client |
| **Vite** | ^7.3.1 | Build tool & dev server |
| **Tailwind CSS** | ^3.4.4 | Utility-first CSS framework |
| **@mui/material** | ^5.18.0 | Material Design components |
| **@mui/x-charts** | ^7.29.1 | Chart components |
| **Chart.js** | ^4.5.1 | Charting library |
| **React Chart.js 2** | ^5.2.0 | React wrapper for Chart.js |
| **GSAP** | ^3.14.2 | Animation library |
| **Lucide React** | ^1.7.0 | Icon library |
| **Class Variance Authority** | ^0.7.1 | CSS class utilities |
| **clsx** | ^2.1.1 | Conditional classnames |
| **Radix UI** | ^1.4.3 | Unstyled accessible components |
| **Emotion** | ^11.14.0+ | CSS-in-JS library |
| **Tailwind Merge** | ^3.5.0 | Merge Tailwind classes |

### Frontend Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **ESLint** | ^9.39.1 | Code linting |
| **@vitejs/plugin-react** | ^5.1.1 | Vite React plugin |
| **Autoprefixer** | ^10.4.27 | CSS vendor prefixer |
| **PostCSS** | ^8.5.8 | CSS processing |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **Express** | ^5.2.1 | Web framework |
| **Firebase Admin SDK** | ^13.7.0 | Firebase backend access |
| **CORS** | ^2.8.6 | Cross-origin resource sharing |
| **Resend** | ^6.10.0 | Email service |

\---

##  Getting Started

### Clone

git clone <your-repo>
cd front-end

### Frontend

npm install

Create .env:
VITE\_API\_URL=https://your-backend.vercel.app

Run:
npm run dev

### Backend

cd server
npm install
vercel --prod

\---

## 🔌 API Docs

### POST /auth/register

Request:
{
"email": "user@example.com",
"password": "123456"
}

Response:
{
"message": "User created"
}

### POST /auth/login

Response:
{
"token": "..."
}

### GET /auth/profile

Header:
Authorization: Bearer <token>

Response:
{
"uid": "123",
"email": "user@example.com"
}

\---

##  Deployment

Backend:
cd server
vercel --prod

Frontend:
npm run build
firebase deploy

\---


