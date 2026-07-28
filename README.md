# 🏥 MediFlow - Hospital Appointment & AI-Assisted Consultation Management System

A full-stack Hospital Management System that streamlines appointment booking, doctor consultations, electronic medical records (EMR), AI-assisted prescription generation, follow-up management, and reporting & analytics.

---

## 🚀 Features

### 👤 Patient
- Register & Login
- Book Appointments
- View Appointment History
- View Prescriptions
- View Follow-up Details

### 👨‍⚕️ Doctor
- Manage Appointments
- Conduct Consultations
- Access Electronic Medical Records (EMR)
- Generate AI-Assisted Prescription Suggestions
- Approve Prescriptions
- Generate Prescription PDF
- Manage Patient Follow-ups

### 🏥 Administrator
- Manage Doctors
- Manage Patients
- Appointment Monitoring
- Reporting & Analytics Dashboard
- Revenue Overview
- Doctor Performance Analysis

---

# 📌 Modules

## Module 1 – Patient Appointment Booking
- Patient Registration
- Appointment Booking
- Appointment Scheduling

## Module 2 – Hospital Appointment Management
- Appointment Approval
- Appointment Status Tracking
- Doctor Schedule Management

## Module 3 – Doctor Consultation Workflow
- Consultation Management
- Diagnosis Recording
- Treatment Planning

## Module 4 – Electronic Medical Records (EMR)
- Medical History
- Vitals
- Diagnoses
- Previous Prescriptions

## Module 5 – AI-Assisted Clinical Decision Support
- AI Prescription Suggestions
- Doctor Approval Workflow
- Prescription PDF Generation
- Audit Logging

## Module 6 – Drug Database Integration
- Local Drug Database
- Medicine Recommendation
- OpenFDA Integration

## Module 7 – Follow-up & Patient Advice Management
- Follow-up Scheduling
- Patient Advice
- Follow-up Status Tracking

## Module 8 – Reporting & Analytics
- Appointment Reports
- Revenue Reports
- Prescription Statistics
- Disease Trends
- Doctor Performance

---

# 🛠 Tech Stack

## Frontend
- React.js
- Vite
- React Router
- Axios
- Tailwind CSS

## Backend
- Node.js
- Express.js

## Database
- MongoDB
- Mongoose

## AI
- OpenAI API (AI-Assisted Prescription Suggestions)

## Other Libraries
- JWT Authentication
- PDFKit
- QRCode
- Nodemailer

---

# 📂 Project Structure

```
Hospital-manegment-system
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/amankr04082005-beep/Hospital-manegment-system.git
cd Hospital-manegment-system
```

---

## Backend

```bash
cd backend
npm install
npm start
```

Runs on:

```
http://localhost:3001
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

# 🔐 Environment Variables

Create a `.env` file inside the backend folder.

```
PORT=3001

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

OPENAI_API_KEY=your_openai_api_key
```

---

# 📊 Reporting Dashboard

The Reporting & Analytics module includes:

- Total Appointments
- Revenue Summary
- Prescription Statistics
- Disease Trends
- Most Prescribed Medicines
- Doctor Performance

---

# 📱 Responsive Design

The application is fully responsive and tested on:

- Desktop
- Tablet
- Mobile Devices
- iPhone
- Android

---

# 🔒 Security

- JWT Authentication
- Password Hashing
- Role-Based Authorization
- Protected Routes
- AI Suggestions Require Doctor Approval

---

# 📷 Screenshots

Add screenshots here:

```
screenshots/
├── login.png
├── dashboard.png
├── consultation.png
├── prescription.png
├── followup.png
└── reports.png
```

---

# 🚀 Future Enhancements

- Video Consultation
- SMS Notifications
- Payment Gateway
- Multi-Hospital Support
- AI Disease Prediction

---

# 👨‍💻 Developer

**Aman Kumar**

BCA Graduate

GitHub:
https://github.com/amankr04082005-beep

---

# 📄 License

This project is developed for educational and demonstration purposes.