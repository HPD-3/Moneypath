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

*  Frontend: https://your-app.web.app
*  API: https://your-backend.vercel.app

\---

##  Screenshots

###  Dashboard

!\[Dashboard Screenshot](./screenshots/dashboard.png)

###  Login

!\[Login Screenshot](./screenshots/login.png)

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

Frontend: React (Vite), Firebase Hosting, Axios  
Backend: Node.js, Express, Vercel  
Auth: Firebase Auth, Firebase Admin SDK

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

## 👨‍💻 Author

Ahmad Hariyanto

