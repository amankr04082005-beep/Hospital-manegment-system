import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Field } from '../../components/common/ui';
import toast from 'react-hot-toast';
import './auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    dob: '',
    gender: 'male',
    bloodGroup: 'unknown',
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ ...form, role: 'patient' });
      toast.success('Account created.');
      navigate('/patient/book');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <Card className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-card__brand">
          <span className="auth-card__mark">+</span>
          <span>MediFlow</span>
        </div>
        <h1>Create your patient account</h1>
        <p className="auth-card__subtitle">Book appointments and view your prescriptions online.</p>

        <form onSubmit={handleSubmit}>
          <Field label="Full name">
            <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Field>
          <Field label="Mobile number">
            <input required value={form.mobileNumber} onChange={(e) => update('mobileNumber', e.target.value)} placeholder="+91..." />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </Field>
          <Field label="Date of birth">
            <input type="date" required value={form.dob} onChange={(e) => update('dob', e.target.value)} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Blood group">
            <select value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)}>
              {['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="auth-card__footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
