import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Field } from '../../components/common/ui';
import toast from 'react-hot-toast';
import './auth.css';

const ROLE_HOME = {
  patient: '/patient/book',
  receptionist: '/receptionist/queue',
  doctor: '/doctor/queue',
  pharmacist: '/pharmacist/prescriptions',
  admin: '/admin/overview',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__mark">+</span>
          <span>MediFlow</span>
        </div>
        <h1>Sign in</h1>
        <p className="auth-card__subtitle">Hospital Appointment &amp; Consultation Management</p>

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@hospital.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="auth-card__footer">
          New patient? <Link to="/register">Create an account</Link>
        </p>

        <div className="auth-card__demo">
          <strong>Demo logins</strong> (after running the seed script):
          <ul>
            <li>doctor@hospital.com / Doctor@1234</li>
            <li>reception@hospital.com / Reception@1234</li>
            <li>patient@hospital.com / Patient@1234</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
