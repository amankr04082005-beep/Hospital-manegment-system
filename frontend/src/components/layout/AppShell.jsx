import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AppShell.css';

const NAV_BY_ROLE = {
  patient: [
    { to: '/patient/book', label: 'Book Appointment' },
    { to: '/patient/appointments', label: 'My Appointments' },
    { to: '/patient/prescriptions', label: 'My Prescriptions' },
  ],
  receptionist: [
    { to: '/receptionist/queue', label: "Today's Queue" },
    { to: '/receptionist/book', label: 'Register Walk-in' },
  ],
  doctor: [
    { to: '/doctor/queue', label: 'My Patients Today' },
    { to: '/doctor/consultations', label: 'Consultations' },
  ],
  pharmacist: [
    { to: '/pharmacist/prescriptions', label: 'Verify Prescriptions' },
    { to: '/pharmacist/inventory', label: 'Manage Inventory' },
  ],
  admin: [
    { to: '/admin/overview', label: 'Hospital Overview' },
    { to: '/admin/reports', label: 'Reporting & Analytics' },
  ],
};

const ROLE_LABEL = {
  patient: 'Patient',
  receptionist: 'Front Desk',
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  admin: 'Administrator',
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <span className="shell__brand-mark">+</span>
          <span className="shell__brand-name">MediFlow</span>
        </div>
        <nav className="shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `shell__nav-link${isActive ? ' shell__nav-link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="shell__user">
          <div className="shell__user-info">
            <span className="shell__user-name">{user?.fullName}</span>
            <span className="shell__user-role">{ROLE_LABEL[user?.role]}</span>
          </div>
          <button className="shell__logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="shell__content">
        <Outlet />
      </main>
    </div>
  );
}