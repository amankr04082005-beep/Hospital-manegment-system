import { useState, useEffect } from 'react';
import { checkHealth, getClinicalRecommendation } from '../../services/aiClinical.service';
import toast from 'react-hot-toast';

function Panel({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {title ? <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>{title}</h3> : null}
      {children}
    </div>
  );
}

function Badge({ children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#0d948815', color: '#0d9488', border: '1px solid #0d948830' }}>
      {children}
    </span>
  );
}

function SeverityTag({ severity, children }) {
  const colors = { severe: '#dc2626', moderate: '#d97706', minor: '#2563eb' };
  const color = colors[severity] || '#64748b';
  return (
    <div style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12.5, background: color + '10', border: '1px solid ' + color + '30', color: color, marginBottom: 4 }}>
      {children}
    </div>
  );
}

export default function AIClinicalDashboard() {
  const [input, setInput] = useState({
    symptoms: '',
    allergies: '',
    existingDiseases: '',
    currentMedications: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const health = await checkHealth();
      setServiceStatus(health);
    })();
  }, []);

  async function handleAnalyze(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const recommendation = await getClinicalRecommendation({
        symptoms: input.symptoms,
        allergies: input.allergies.split(',').map(s => s.trim()).filter(Boolean),
        existingDiseases: input.existingDiseases.split(',').map(s => s.trim()).filter(Boolean),
        currentMedications: input.currentMedications.split(',').map(s => s.trim()).filter(Boolean)
      });
      setResult(recommendation);
      toast.success('AI clinical analysis complete!');
    } catch (err) {
      const msg = err.message || 'Could not connect to Python ML service';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(field) {
    return (e) => setInput(prev => ({ ...prev, [field]: e.target.value }));
  }

  function handleClear() {
    setInput({ symptoms: '', allergies: '', existingDiseases: '', currentMedications: '' });
    setResult(null);
    setError(null);
  }

  const inputStyle = {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 14,
    boxSizing: 'border-box',
    background: 'white'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>AI Clinical Decision Support</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 0' }}>
            Powered by Python ML Engine - TF-IDF + Naive Bayes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: serviceStatus ? '#22c55e' : '#ef4444'
          }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {serviceStatus ? 'Python ML Service Online' : 'Python ML Service Offline'}
          </span>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(500px, 100%), 1fr))', gap: 20 }}>
        {/* Left: Input Form */}
        <Panel title="Patient Symptoms">
          <form onSubmit={handleAnalyze}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Symptoms / Chief Complaint
              </label>
              <textarea
                rows={4}
                required
                value={input.symptoms}
                onChange={handleInputChange('symptoms')}
                placeholder="e.g. fever, cough, headache since 3 days..."
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Allergies (comma separated)
              </label>
              <input
                value={input.allergies}
                onChange={handleInputChange('allergies')}
                placeholder="e.g. penicillin, sulfa"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Existing Diseases (comma separated)
              </label>
              <input
                value={input.existingDiseases}
                onChange={handleInputChange('existingDiseases')}
                placeholder="e.g. diabetes, hypertension"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Current Medications (comma separated)
              </label>
              <input
                value={input.currentMedications}
                onChange={handleInputChange('currentMedications')}
                placeholder="e.g. metformin"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={loading || !input.symptoms.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: loading || !input.symptoms.trim() ? '#94a3b8' : '#0d9488',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: (loading || !input.symptoms.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Analyzing...' : 'Analyze with Python ML'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: 'white',
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </Panel>

        {/* Right: Results Panel */}
        <Panel title="ML Analysis Results">
          {/* AI Badge */}
          {result && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <Badge>AI Suggested - Pending Doctor Approval</Badge>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#991b1b' }}>
              {error}
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <p style={{ fontSize: 48, margin: '0 0 12px 0' }}>&#129302;</p>
              <p style={{ margin: 0 }}>Enter symptoms and click Analyze</p>
              <p style={{ fontSize: 12, marginTop: 8, color: '#94a3b8' }}>
                ML: TF-IDF + Naive Bayes + Cosine Similarity
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                width: 40, height: 40,
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #0d9488',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 0.8s linear infinite'
              }} />
              <p style={{ color: '#64748b', margin: 0 }}>Calling Python ML service...</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Probable Diagnoses */}
              {result.probableDiagnoses && result.probableDiagnoses.length > 0 && (
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Probable Diagnoses (ML Classifier)</strong>
                  {result.probableDiagnoses.map((d, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, marginBottom: 4,
                      border: '1px solid #bbf7d0'
                    }}>
                      <span style={{ fontSize: 13.5 }}>{d.diagnosis}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: (d.confidence || 0) >= 0.4 ? '#16a34a' : '#ca8a04' }}>
                        {Math.round((d.confidence || 0) * 100)}% confidence
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Medicine Suggestions */}
              {result.medicineSuggestions && result.medicineSuggestions.length > 0 && (
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Recommended Medicines (Cosine Similarity)</strong>
                  {result.medicineSuggestions.map((m, i) => (
                    <div key={i} style={{ padding: 10, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 13.5 }}>{m.brandName}</strong>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{m.genericName || m.composition}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                        {m.dosage} - {m.frequency} - {m.durationDays} days
                      </div>
                      {m.instructions && <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{m.instructions}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Clinical Advice */}
              {result.clinicalAdvice && (
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Clinical Advice</strong>
                  {result.clinicalAdvice.dietRecommendations && result.clinicalAdvice.dietRecommendations.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Diet:</span>
                      <ul style={{ margin: '4px 0', paddingLeft: 16, fontSize: 12.5 }}>
                        {result.clinicalAdvice.dietRecommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.clinicalAdvice.lifestyleRecommendations && result.clinicalAdvice.lifestyleRecommendations.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Lifestyle:</span>
                      <ul style={{ margin: '4px 0', paddingLeft: 16, fontSize: 12.5 }}>
                        {result.clinicalAdvice.lifestyleRecommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.clinicalAdvice.followUpSuggestions && result.clinicalAdvice.followUpSuggestions.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Follow-up:</span>
                      <ul style={{ margin: '4px 0', paddingLeft: 16, fontSize: 12.5 }}>
                        {result.clinicalAdvice.followUpSuggestions.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.clinicalAdvice.suggestedLabTests && result.clinicalAdvice.suggestedLabTests.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Lab Tests:</span>
                      <ul style={{ margin: '4px 0', paddingLeft: 16, fontSize: 12.5 }}>
                        {result.clinicalAdvice.suggestedLabTests.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Safety Alerts */}
              {(result.allergyAlerts && result.allergyAlerts.length > 0) ||
               (result.contraindicationAlerts && result.contraindicationAlerts.length > 0) ||
               (result.interactionWarnings && result.interactionWarnings.length > 0) ? (
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 8, color: '#dc2626' }}>Safety Alerts</strong>
                  {result.allergyAlerts && result.allergyAlerts.map((a, idx) => (
                    <SeverityTag key={'al-' + idx} severity="severe">{a}</SeverityTag>
                  ))}
                  {result.contraindicationAlerts && result.contraindicationAlerts.map((a, idx) => (
                    <SeverityTag key={'co-' + idx} severity="moderate">{a}</SeverityTag>
                  ))}
                  {result.interactionWarnings && result.interactionWarnings.map((w, idx) => (
                    <SeverityTag key={'in-' + idx} severity={w.severity}>{w.description}</SeverityTag>
                  ))}
                </div>
              ) : null}

              {/* Footer */}
              {result.generatedAt && (
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', margin: 0 }}>
                  Generated: {new Date(result.generatedAt).toLocaleString()}
                  {result.aiModelVersion ? ' | Model: ' + result.aiModelVersion : ''}
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
