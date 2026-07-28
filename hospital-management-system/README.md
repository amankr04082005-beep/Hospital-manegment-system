# 🏥 MediFlow – Hospital Appointment & AI-Assisted Consultation Management System

A full-stack Hospital Management System designed to streamline hospital operations, patient appointments, doctor consultations, Electronic Medical Records (EMR), AI-assisted prescription generation, follow-up management, and reporting & analytics.

---

# 📌 Features

## 👤 Patient
- Patient Registration & Login
- Book Hospital Appointments
- View Appointment History
- View Prescriptions
- View Follow-up Details

## 👨‍⚕️ Doctor
- Manage Appointments
- Conduct Patient Consultations
- Access Electronic Medical Records (EMR)
- Generate AI-Assisted Prescription Suggestions
- Approve Prescriptions
- Generate Prescription PDF
- Schedule Patient Follow-ups

## 🏥 Administrator
- Manage Doctors
- Manage Patients
- Monitor Appointments
- Reporting & Analytics Dashboard
- Revenue Tracking
- Doctor Performance Analysis

---

# 📚 Project Modules

### ✅ Module 1 – Patient Appointment Booking
- Patient Registration
- Appointment Booking
- Appointment Scheduling

### ✅ Module 2 – Hospital Appointment Management
- Appointment Approval
- Appointment Status Tracking
- Doctor Schedule Management

### ✅ Module 3 – Doctor Consultation Workflow
- Consultation Management
- Diagnosis Recording
- Treatment Planning

### ✅ Module 4 – Electronic Medical Records (EMR)
- Medical History
- Patient Vitals
- Diagnoses
- Previous Prescriptions

### ✅ Module 5 – AI-Assisted Clinical Decision Support
- AI Prescription Suggestions
- Doctor Approval Workflow
- Prescription PDF Generation
- Audit Logging

### ✅ Module 6 – Drug Database Integration
- Local Medicine Database
- Medicine Recommendation
- OpenFDA Integration

### ✅ Module 7 – Follow-up & Patient Advice Management
- Follow-up Scheduling
- Patient Advice
- Follow-up Status Tracking

### ✅ Module 8 – Reporting & Analytics
- Appointment Reports
- Revenue Reports
- Disease Trends
- Most Prescribed Medicines
- Doctor Performance

---

# 🛠 Technology Stack

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

## AI Integration
- OpenAI API

## Other Libraries
- JWT Authentication
- PDFKit
- QRCode
- Nodemailer

---

# 📁 Project Structure

```text
Hospital-manegment-system
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   └── server.js
│   │
│   ├── uploads
│   ├── package.json
│   └── .env
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── layouts
│   │   ├── pages
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs
│   └── uml
│       ├── project-structure.puml
│       ├── use-case.puml
│       ├── class-diagram.puml
│       ├── sequence-diagram.puml
│       ├── deployment-diagram.puml
│       └── er-diagram.puml
│
├── README.md
└── .gitignore
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/amankr04082005-beep/Hospital-manegment-system.git
cd Hospital-manegment-system
```

---

## Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on:

```
http://localhost:3001
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🔐 Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=3001

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

OPENAI_API_KEY=your_openai_api_key
```

---

# 📊 Reporting & Analytics

The dashboard provides:

- Total Appointments
- Appointment Status Summary
- Revenue Overview
- Prescription Statistics
- Disease Trends
- Most Prescribed Medicines
- Doctor Performance

---

# 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop
- Laptop
- Tablet
- Android Devices
- iPhone Devices

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing
- Protected Routes
- Role-Based Authorization
- Secure REST APIs
- AI Suggestions Require Doctor Approval

---

# 🚀 Future Enhancements

- Video Consultation
- SMS Notifications
- Payment Gateway Integration
- Multi-Hospital Support
- AI Disease Prediction

---

# 📸 Screenshots

```
screenshots/
├── login.png
├── dashboard.png
├── consultation.png
├── prescription.png
├── followup.png
└── reports.png
```

(Add screenshots after deployment.)

---

# 👨‍💻 Developer

**Aman Kumar**

**BCA Graduate**

GitHub:
https://github.com/amankr04082005-beep

---

# ⭐ If you found this project useful, don't forget to give it a star.

# 📄 License

This project is developed for educational and demonstration purposes.