/**
 * Symptom -> Clinical Suggestion knowledge base.
 *
 * Each entry = one condition. `medicineSuggestions` combines three
 * systems (Allopathic / Homeopathic / Ayurvedic) tagged in the
 * `brandName` and `instructions` fields so the existing frontend
 * (which only reads brandName/composition/dosage/frequency/
 * durationDays/instructions/source) needs NO changes.
 *
 * Safety note: for potentially serious / systemic conditions
 * (dengue, malaria, typhoid, diabetes, hypertension, asthma,
 * jaundice, chest pain, etc.) this file deliberately does NOT
 * suggest specific prescription dosing. It only flags the probable
 * condition and recommends urgent clinical workup / referral. This
 * keeps the "AI Suggested — Pending Doctor Approval" gate meaningful:
 * the AI proposes, it never prescribes anything for conditions that
 * need real diagnostics.
 */

const SYMPTOM_KNOWLEDGE_BASE = [
  // ---------------- Common / self-limiting conditions ----------------
  {
    keywords: ['fever', 'temperature', 'chills'],
    probableDiagnoses: [
      { diagnosis: 'Viral fever', confidence: 0.7 },
      { diagnosis: 'Common cold / Upper respiratory infection', confidence: 0.5 },
    ],
    medicineSuggestions: [
      { brandName: 'Dolo 650', genericName: 'Paracetamol', composition: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'Every 6-8 hours as needed', durationDays: 3, instructions: 'Allopathic. Take after food. Do not exceed 4 tablets in 24 hours.' },
      { brandName: 'Belladonna 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed by practitioner', durationDays: 3, instructions: 'Traditionally used for sudden high fever. Individualize with a qualified homeopath.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Drink plenty of fluids', 'Light, easily digestible meals'], lifestyleRecommendations: ['Adequate rest', 'Avoid strenuous activity'], followUpSuggestions: ['Follow up if fever persists beyond 3 days'], suggestedLabTests: ['CBC if fever persists beyond 3 days'] },
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'throat pain'],
    probableDiagnoses: [{ diagnosis: 'Acute upper respiratory tract infection', confidence: 0.65 }],
    medicineSuggestions: [
      { brandName: 'Benadryl', genericName: 'Diphenhydramine', composition: 'Diphenhydramine 12.5mg', dosage: '10ml', frequency: 'Twice daily', durationDays: 5, instructions: 'Allopathic. Take after food. May cause drowsiness.' },
      { brandName: 'Bryonia Alba 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 5, instructions: 'Traditionally used for dry cough. Individualize with a practitioner.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Warm fluids', 'Avoid cold drinks/ice cream'], lifestyleRecommendations: ['Steam inhalation', 'Gargle with warm salt water'], followUpSuggestions: ['Follow up if symptoms persist beyond 5-7 days'], suggestedLabTests: [] },
  },
  {
    keywords: ['headache', 'migraine'],
    probableDiagnoses: [{ diagnosis: 'Tension headache', confidence: 0.6 }],
    medicineSuggestions: [
      { brandName: 'Crocin', genericName: 'Paracetamol', composition: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Every 8 hours as needed', durationDays: 2, instructions: 'Allopathic. Take after food.' },
      { brandName: 'Nux Vomica 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 2, instructions: 'Traditionally used for stress-related headache.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Stay hydrated'], lifestyleRecommendations: ['Reduce screen time', 'Adequate sleep'], followUpSuggestions: ['Follow up if headaches are recurrent or severe'], suggestedLabTests: [] },
  },
  {
    keywords: ['stomach', 'abdominal', 'nausea', 'vomit', 'diarrhea', 'loose motion'],
    probableDiagnoses: [{ diagnosis: 'Acute gastroenteritis', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'ORS', genericName: 'Oral Rehydration Salts', composition: 'Electrolyte mixture', dosage: '1 sachet in 1L water', frequency: 'Sip throughout the day', durationDays: 3, instructions: 'Allopathic/supportive. Continue normal feeding. Avoid oily/spicy food.' },
      { brandName: 'Arsenicum Album 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 3, instructions: 'Traditionally used for gastroenteritis with weakness.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Bland diet (BRAT: banana, rice, applesauce, toast)', 'Avoid dairy and oily food'], lifestyleRecommendations: ['Rest', 'Maintain hand hygiene'], followUpSuggestions: ['Seek care urgently if signs of dehydration appear'], suggestedLabTests: ['Stool routine examination if symptoms persist'] },
  },
  {
    keywords: ['skin allergy', 'rash', 'itching', 'hives', 'allergic reaction'],
    probableDiagnoses: [{ diagnosis: 'Allergic contact dermatitis / Urticaria', confidence: 0.6 }],
    medicineSuggestions: [
      { brandName: 'Cetrizine', genericName: 'Cetirizine', composition: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily at night', durationDays: 5, instructions: 'Allopathic. May cause mild drowsiness. Avoid known allergen triggers.' },
      { brandName: 'Rhus Tox 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 5, instructions: 'Traditionally used for itchy, blistering skin reactions.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Avoid known food allergens'], lifestyleRecommendations: ['Avoid scratching', 'Use mild, fragrance-free soap'], followUpSuggestions: ['Follow up if rash spreads or breathing difficulty occurs'], suggestedLabTests: [] },
  },
  {
    keywords: ['acne', 'pimple', 'pimples'],
    probableDiagnoses: [{ diagnosis: 'Acne vulgaris', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Benzoyl Peroxide 2.5% gel', composition: 'Benzoyl Peroxide', dosage: 'Thin layer', frequency: 'Once daily at night', durationDays: 14, instructions: 'Allopathic topical. Use sunscreen during the day.' },
      { brandName: 'Kali Bromatum 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 14, instructions: 'Traditionally used for acne with pustules.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Limit oily/fried food'], lifestyleRecommendations: ['Avoid touching face', 'Regular cleansing'], followUpSuggestions: ['Refer to dermatologist if severe/cystic'], suggestedLabTests: [] },
  },
  {
    keywords: ['ringworm', 'fungal infection', 'fungal', 'tinea'],
    probableDiagnoses: [{ diagnosis: 'Superficial fungal skin infection (Tinea)', confidence: 0.6 }],
    medicineSuggestions: [
      { brandName: 'Clotrimazole 1% cream', composition: 'Clotrimazole', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 14, instructions: 'Allopathic topical antifungal.' },
      { brandName: 'Sepia 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 14, instructions: 'Traditionally used for fungal skin conditions.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Keep area dry', 'Avoid sharing towels/clothing'], followUpSuggestions: ['Follow up if not resolving in 2 weeks'], suggestedLabTests: [] },
  },
  {
    keywords: ['eczema'],
    probableDiagnoses: [{ diagnosis: 'Atopic dermatitis (Eczema)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Hydrocortisone 1% cream', composition: 'Hydrocortisone', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 7, instructions: 'Allopathic mild topical steroid, short course only.' },
      { brandName: 'Graphites 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 7, instructions: 'Traditionally used for eczema with oozing.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Identify and avoid trigger foods if known'], lifestyleRecommendations: ['Moisturize regularly', 'Avoid hot showers'], followUpSuggestions: ['Refer to dermatologist if chronic/recurrent'], suggestedLabTests: [] },
  },
  {
    keywords: ['psoriasis'],
    probableDiagnoses: [{ diagnosis: 'Psoriasis (suspected)', confidence: 0.4 }],
    medicineSuggestions: [
      { brandName: 'Coal tar ointment', composition: 'Coal tar', dosage: 'Thin layer', frequency: 'Once daily', durationDays: 14, instructions: 'Allopathic. Needs dermatologist confirmation of diagnosis first.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Moisturize regularly', 'Avoid skin trauma'], followUpSuggestions: ['Refer to dermatologist for confirmed diagnosis and long-term plan'], suggestedLabTests: [] },
  },
  {
    keywords: ['joint pain', 'arthritis', 'knee pain'],
    probableDiagnoses: [{ diagnosis: 'Osteoarthritis / Non-specific joint pain', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Diclofenac gel', composition: 'Diclofenac 1%', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 7, instructions: 'Allopathic topical NSAID.' },
      { brandName: 'Rhus Tox 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 7, instructions: 'Traditionally used for stiffness that improves with movement.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Maintain healthy weight'], lifestyleRecommendations: ['Gentle stretching/physiotherapy'], followUpSuggestions: ['Refer to orthopedist if swelling/deformity or non-improving'], suggestedLabTests: ['X-ray if persistent'] },
  },
  {
    keywords: ['back pain', 'lower back pain', 'lumbar pain'],
    probableDiagnoses: [{ diagnosis: 'Mechanical low back pain', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Ibuprofen 400mg', composition: 'Ibuprofen', dosage: '1 tablet', frequency: 'Every 8 hours with food', durationDays: 3, instructions: 'Allopathic. Avoid if history of ulcers/kidney disease.' },
      { brandName: 'Bryonia Alba 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 3, instructions: 'Traditionally used for pain worse on movement.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Avoid heavy lifting', 'Maintain good posture'], followUpSuggestions: ['Refer if radiating leg pain, numbness, or bladder/bowel symptoms (red flag)'], suggestedLabTests: [] },
  },
  {
    keywords: ['neck pain', 'cervical pain', 'spondylosis'],
    probableDiagnoses: [{ diagnosis: 'Cervical muscle strain', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Diclofenac gel', composition: 'Diclofenac 1%', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 5, instructions: 'Allopathic topical NSAID.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Neck stretches', 'Correct screen/desk posture'], followUpSuggestions: ['Refer if arm numbness/weakness'], suggestedLabTests: [] },
  },
  {
    keywords: ['sprain', 'muscle strain', 'ankle sprain'],
    probableDiagnoses: [{ diagnosis: 'Soft tissue sprain/strain', confidence: 0.6 }],
    medicineSuggestions: [
      { brandName: 'Diclofenac gel', composition: 'Diclofenac 1%', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 5, instructions: 'Allopathic topical NSAID. RICE protocol (Rest, Ice, Compression, Elevation).' },
      { brandName: 'Arnica Montana 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 5, instructions: 'Traditionally used for bruising/soft tissue injury.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Rest and elevate the limb', 'Ice application 15-20 min'], followUpSuggestions: ['X-ray if unable to bear weight/severe swelling'], suggestedLabTests: [] },
  },
  {
    keywords: ['eye redness', 'red eye', 'conjunctivitis', 'pink eye'],
    probableDiagnoses: [{ diagnosis: 'Conjunctivitis (suspected)', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Moxifloxacin eye drops', composition: 'Moxifloxacin 0.5%', dosage: '1 drop', frequency: '4 times daily', durationDays: 5, instructions: 'Allopathic. Avoid touching dropper tip to eye.' },
      { brandName: 'Euphrasia 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 5, instructions: 'Traditionally used for eye redness/watering.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Avoid touching/rubbing eyes', 'Maintain hand hygiene, avoid sharing towels'], followUpSuggestions: ['Refer to ophthalmologist if vision affected or severe pain'], suggestedLabTests: [] },
  },
  {
    keywords: ['eye strain', 'dry eyes', 'watery eyes'],
    probableDiagnoses: [{ diagnosis: 'Digital eye strain / Dry eye', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Carboxymethylcellulose eye drops', composition: 'Lubricant eye drops', dosage: '1 drop', frequency: '3-4 times daily', durationDays: 7, instructions: 'Allopathic lubricant, safe for regular use.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['20-20-20 rule for screen use', 'Adequate lighting while reading'], followUpSuggestions: ['Refer for vision check if persistent'], suggestedLabTests: [] },
  },
  {
    keywords: ['ear pain', 'ear infection', 'otitis'],
    probableDiagnoses: [{ diagnosis: 'Otitis media/externa (suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Ofloxacin ear drops', composition: 'Ofloxacin 0.3%', dosage: '2-3 drops', frequency: 'Twice daily', durationDays: 7, instructions: 'Allopathic. Confirm with otoscopic exam first.' },
      { brandName: 'Chamomilla 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 5, instructions: 'Traditionally used for ear pain, especially in children.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Keep ear dry', 'Avoid inserting objects into ear'], followUpSuggestions: ['Refer to ENT if discharge, hearing loss, or fever'], suggestedLabTests: [] },
  },
  {
    keywords: ['sinusitis', 'sinus pain', 'facial pain'],
    probableDiagnoses: [{ diagnosis: 'Sinusitis (suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Xylometazoline nasal spray', composition: 'Xylometazoline 0.1%', dosage: '2 sprays', frequency: 'Twice daily', durationDays: 3, instructions: 'Allopathic decongestant. Do not use beyond 3-5 days (rebound congestion).' },
    ],
    clinicalAdvice: { dietRecommendations: ['Warm fluids'], lifestyleRecommendations: ['Steam inhalation'], followUpSuggestions: ['Refer to ENT if symptoms persist beyond 10 days'], suggestedLabTests: [] },
  },
  {
    keywords: ['tonsillitis', 'tonsil pain'],
    probableDiagnoses: [{ diagnosis: 'Acute tonsillitis (suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Amoxicillin 500mg', composition: 'Amoxicillin', dosage: '1 capsule', frequency: 'Every 8 hours', durationDays: 5, instructions: 'Allopathic antibiotic — confirm bacterial cause (throat swab) before starting; check penicillin allergy first.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Warm fluids, soft food'], lifestyleRecommendations: ['Gargle with warm salt water'], followUpSuggestions: ['Refer to ENT if recurrent (>5-6 episodes/year)'], suggestedLabTests: ['Throat swab if recurrent'] },
  },
  {
    keywords: ['toothache', 'tooth pain', 'dental pain'],
    probableDiagnoses: [{ diagnosis: 'Dental pain (caries/pulpitis suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Ibuprofen 400mg', composition: 'Ibuprofen', dosage: '1 tablet', frequency: 'Every 8 hours with food', durationDays: 2, instructions: 'Allopathic pain relief only — refer to dentist for definitive treatment.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Avoid very hot/cold/sweet food'], lifestyleRecommendations: ['Maintain oral hygiene'], followUpSuggestions: ['Refer to dentist promptly'], suggestedLabTests: [] },
  },
  {
    keywords: ['mouth ulcer', 'canker sore'],
    probableDiagnoses: [{ diagnosis: 'Aphthous ulcer', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Triamcinolone oral paste', composition: 'Triamcinolone 0.1%', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 5, instructions: 'Allopathic topical steroid paste.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Avoid spicy/acidic food'], lifestyleRecommendations: [], followUpSuggestions: ['Refer if recurrent or non-healing beyond 2 weeks'], suggestedLabTests: [] },
  },
  {
    keywords: ['acidity', 'heartburn', 'gerd', 'gastritis'],
    probableDiagnoses: [{ diagnosis: 'Acid reflux / Gastritis', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Pantoprazole 40mg', composition: 'Pantoprazole', dosage: '1 tablet', frequency: 'Once daily before breakfast', durationDays: 7, instructions: 'Allopathic proton pump inhibitor.' },
      { brandName: 'Nux Vomica 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 7, instructions: 'Traditionally used for acidity from spicy food/stress.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Avoid spicy/oily food, caffeine, late-night meals'], lifestyleRecommendations: ['Avoid lying down right after eating'], followUpSuggestions: ['Refer if alarm symptoms: weight loss, black stools, difficulty swallowing'], suggestedLabTests: [] },
  },
  {
    keywords: ['constipation'],
    probableDiagnoses: [{ diagnosis: 'Functional constipation', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Lactulose syrup', composition: 'Lactulose', dosage: '15ml', frequency: 'Once daily at night', durationDays: 5, instructions: 'Allopathic osmotic laxative.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Increase fiber and water intake'], lifestyleRecommendations: ['Regular physical activity'], followUpSuggestions: ['Refer if blood in stool or unintentional weight loss'], suggestedLabTests: [] },
  },
  {
    keywords: ['piles', 'hemorrhoids'],
    probableDiagnoses: [{ diagnosis: 'Hemorrhoids (suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Lignocaine ointment', composition: 'Lignocaine 5%', dosage: 'Thin layer', frequency: 'Twice daily', durationDays: 7, instructions: 'Allopathic topical local anesthetic.' },
    ],
    clinicalAdvice: { dietRecommendations: ['High-fiber diet, plenty of water'], lifestyleRecommendations: ['Avoid straining, sitz baths'], followUpSuggestions: ['Refer to surgeon if bleeding/prolapse persists'], suggestedLabTests: [] },
  },
  {
    keywords: ['urinary', 'burning urination', 'uti', 'frequent urination'],
    probableDiagnoses: [{ diagnosis: 'Urinary tract infection (suspected)', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Nitrofurantoin 100mg', composition: 'Nitrofurantoin', dosage: '1 capsule', frequency: 'Twice daily', durationDays: 5, instructions: 'Allopathic antibiotic — urine culture recommended, especially if recurrent.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Increase water intake'], lifestyleRecommendations: ['Maintain genital hygiene, urinate after intercourse'], followUpSuggestions: ['Refer if fever/flank pain (possible kidney involvement)'], suggestedLabTests: ['Urine routine/culture'] },
  },
  {
    keywords: ['menstrual cramps', 'period pain', 'dysmenorrhea'],
    probableDiagnoses: [{ diagnosis: 'Primary dysmenorrhea', confidence: 0.6 }],
    medicineSuggestions: [
      { brandName: 'Mefenamic Acid 500mg', composition: 'Mefenamic Acid', dosage: '1 tablet', frequency: 'Every 8 hours with food', durationDays: 3, instructions: 'Allopathic NSAID.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Warm compress on lower abdomen', 'Light exercise'], followUpSuggestions: ['Refer to gynecologist if severe or worsening'], suggestedLabTests: [] },
  },
  {
    keywords: ['irregular periods', 'missed period', 'delayed period'],
    probableDiagnoses: [{ diagnosis: 'Menstrual irregularity — needs evaluation', confidence: 0.35 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Maintain healthy weight and stress levels'], followUpSuggestions: ['Refer to gynecologist for evaluation (rule out pregnancy, PCOS, thyroid)'], suggestedLabTests: ['Beta-hCG, Thyroid profile, Pelvic ultrasound as indicated'] },
  },
  {
    keywords: ['vaginal discharge', 'leucorrhea'],
    probableDiagnoses: [{ diagnosis: 'Vaginal discharge — needs evaluation', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Maintain genital hygiene, cotton undergarments'], followUpSuggestions: ['Refer to gynecologist for examination and appropriate testing before treatment'], suggestedLabTests: ['Vaginal swab as indicated'] },
  },
  {
    keywords: ['weakness', 'fatigue', 'tiredness', 'anemia'],
    probableDiagnoses: [{ diagnosis: 'Fatigue — possible anemia/nutritional deficiency', confidence: 0.4 }],
    medicineSuggestions: [
      { brandName: 'Ferrous Sulphate + Folic Acid', composition: 'Iron + Folic Acid', dosage: '1 tablet', frequency: 'Once daily after food', durationDays: 30, instructions: 'Allopathic — confirm with hemoglobin/iron studies before prolonged use.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Iron-rich diet: leafy greens, jaggery, legumes'], lifestyleRecommendations: ['Adequate sleep'], followUpSuggestions: ['Refer if severe/persistent — needs blood workup'], suggestedLabTests: ['CBC, Iron studies'] },
  },
  {
    keywords: ['insomnia', 'sleep problem', 'unable to sleep'],
    probableDiagnoses: [{ diagnosis: 'Insomnia (situational)', confidence: 0.4 }],
    medicineSuggestions: [
      { brandName: 'Coffea Cruda 30C (Homeopathic)', composition: 'Homeopathic remedy', dosage: '4 pills', frequency: 'As directed', durationDays: 7, instructions: 'Traditionally used for restless sleep from overactive mind.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Avoid caffeine after afternoon'], lifestyleRecommendations: ['Sleep hygiene: fixed schedule, avoid screens before bed'], followUpSuggestions: ['Refer if persistent >2-3 weeks or affecting daily function'], suggestedLabTests: [] },
  },
  {
    keywords: ['anxiety', 'stress', 'nervousness'],
    probableDiagnoses: [{ diagnosis: 'Situational stress/anxiety — needs assessment', confidence: 0.35 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Relaxation techniques, regular exercise, adequate sleep'], followUpSuggestions: ['Refer to physician/counselor for proper assessment — medication decisions need specialist evaluation'], suggestedLabTests: [] },
  },
  {
    keywords: ['chickenpox'],
    probableDiagnoses: [{ diagnosis: 'Chickenpox (suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Calamine lotion', composition: 'Calamine', dosage: 'Apply locally', frequency: 'As needed for itching', durationDays: 7, instructions: 'Allopathic supportive topical care.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Plenty of fluids'], lifestyleRecommendations: ['Isolate until lesions crust over', 'Keep nails trimmed to avoid scratching'], followUpSuggestions: ['Refer urgently if high fever, breathing difficulty, or in adults/pregnant/immunocompromised'], suggestedLabTests: [] },
  },
  {
    keywords: ['measles'],
    probableDiagnoses: [{ diagnosis: 'Measles (suspected) — needs confirmation', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Plenty of fluids, Vitamin A rich foods'], lifestyleRecommendations: ['Isolation to prevent spread'], followUpSuggestions: ['Refer promptly — notifiable disease, needs clinical confirmation and monitoring for complications'], suggestedLabTests: [] },
  },
  {
    keywords: ['mumps'],
    probableDiagnoses: [{ diagnosis: 'Mumps (suspected) — needs confirmation', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Soft food (avoid sour/acidic food)'], lifestyleRecommendations: ['Isolation, rest'], followUpSuggestions: ['Refer for clinical confirmation and monitoring for complications'], suggestedLabTests: [] },
  },
  {
    keywords: ['dengue'],
    probableDiagnoses: [{ diagnosis: 'Dengue fever — suspected, needs urgent testing', confidence: 0.4 }],
    medicineSuggestions: [
      { brandName: 'Paracetamol 650mg', composition: 'Paracetamol', dosage: '1 tablet', frequency: 'Every 6-8 hours if needed', durationDays: 3, instructions: 'Allopathic — ONLY paracetamol for fever. Avoid NSAIDs/Aspirin (bleeding risk) until dengue is ruled out.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Plenty of oral fluids'], lifestyleRecommendations: ['Rest, mosquito bite prevention for household'], followUpSuggestions: ['Refer urgently for platelet count monitoring; watch for warning signs (bleeding, severe abdominal pain, persistent vomiting)'], suggestedLabTests: ['CBC with platelet count, NS1/Dengue serology'] },
  },
  {
    keywords: ['typhoid'],
    probableDiagnoses: [{ diagnosis: 'Typhoid fever — suspected, needs testing', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Soft, easily digestible diet'], lifestyleRecommendations: ['Rest, safe drinking water'], followUpSuggestions: ['Refer for blood culture/Widal testing before starting antibiotics'], suggestedLabTests: ['Blood culture, Widal test'] },
  },
  {
    keywords: ['malaria'],
    probableDiagnoses: [{ diagnosis: 'Malaria — suspected, needs testing', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Plenty of fluids'], lifestyleRecommendations: ['Mosquito bite prevention'], followUpSuggestions: ['Refer urgently for peripheral smear/rapid test — treatment depends on species identification'], suggestedLabTests: ['Peripheral blood smear, Malaria rapid antigen test'] },
  },
  {
    keywords: ['jaundice', 'yellow eyes', 'yellow skin'],
    probableDiagnoses: [{ diagnosis: 'Jaundice — suspected, needs evaluation', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Low-fat, easily digestible diet', 'Avoid alcohol'], lifestyleRecommendations: ['Rest'], followUpSuggestions: ['Refer urgently — needs liver function tests to determine cause before any treatment'], suggestedLabTests: ['LFT, Hepatitis panel, Ultrasound abdomen'] },
  },
  {
    keywords: ['diabetes', 'excessive thirst', 'frequent urination sugar', 'high sugar'],
    probableDiagnoses: [{ diagnosis: 'Suspected hyperglycemia — needs testing', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Reduce refined sugar/carbohydrate intake pending diagnosis'], lifestyleRecommendations: ['Regular physical activity'], followUpSuggestions: ['Refer for blood sugar testing — medication/insulin dosing must be individualized by a physician, not AI-suggested'], suggestedLabTests: ['Fasting/PP blood glucose, HbA1c'] },
  },
  {
    keywords: ['hypertension', 'high blood pressure', 'bp high'],
    probableDiagnoses: [{ diagnosis: 'Suspected hypertension — needs confirmation', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Reduce salt intake'], lifestyleRecommendations: ['Regular exercise, stress reduction, avoid smoking/alcohol'], followUpSuggestions: ['Refer for BP monitoring over multiple readings — antihypertensive dosing must be individualized by a physician'], suggestedLabTests: ['Serial BP readings, Renal function, Lipid profile'] },
  },
  {
    keywords: ['asthma', 'breathlessness', 'wheezing', 'shortness of breath'],
    probableDiagnoses: [{ diagnosis: 'Suspected reactive airway disease/Asthma', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Avoid known triggers (dust, smoke, cold air)'], followUpSuggestions: ['Refer urgently to physician/pulmonologist — inhaler/steroid dosing needs individualized prescription, not AI suggestion'], suggestedLabTests: ['Pulmonary function test / Peak flow as advised by physician'] },
  },
  {
    keywords: ['chest pain'],
    probableDiagnoses: [{ diagnosis: 'Chest pain — needs urgent evaluation to rule out cardiac cause', confidence: 0.3 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: [], followUpSuggestions: ['URGENT: Refer immediately for clinical evaluation/ECG — chest pain requires prompt cardiac workup, no self-medication'], suggestedLabTests: ['ECG, Troponin as clinically indicated'] },
  },
  {
    keywords: ['vertigo', 'dizziness', 'giddiness'],
    probableDiagnoses: [{ diagnosis: 'Vertigo (suspected benign positional)', confidence: 0.45 }],
    medicineSuggestions: [
      { brandName: 'Betahistine 16mg', composition: 'Betahistine', dosage: '1 tablet', frequency: 'Twice daily', durationDays: 5, instructions: 'Allopathic — confirm benign cause before prolonged use.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Stay hydrated'], lifestyleRecommendations: ['Avoid sudden head movements'], followUpSuggestions: ['Refer if associated with hearing loss, weakness, or slurred speech (red flag)'], suggestedLabTests: [] },
  },
  {
    keywords: ['weight loss', 'unexplained weight loss'],
    probableDiagnoses: [{ diagnosis: 'Unexplained weight loss — needs evaluation', confidence: 0.35 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: [], followUpSuggestions: ['Refer for thorough evaluation — unexplained weight loss needs systematic workup'], suggestedLabTests: ['CBC, Thyroid profile, Blood glucose, as guided by physician'] },
  },
  {
    keywords: ['hair fall', 'hair loss'],
    probableDiagnoses: [{ diagnosis: 'Hair loss (non-specific)', confidence: 0.4 }],
    medicineSuggestions: [
      { brandName: 'Biotin supplement', composition: 'Biotin 5mg', dosage: '1 tablet', frequency: 'Once daily', durationDays: 30, instructions: 'Allopathic supplement.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Protein-rich diet'], lifestyleRecommendations: ['Gentle hair care, avoid excess heat styling'], followUpSuggestions: ['Refer to dermatologist if patchy/sudden hair loss'], suggestedLabTests: ['Thyroid profile, Iron studies if indicated'] },
  },
  {
    keywords: ['dandruff'],
    probableDiagnoses: [{ diagnosis: 'Seborrheic dermatitis (Dandruff)', confidence: 0.55 }],
    medicineSuggestions: [
      { brandName: 'Ketoconazole 2% shampoo', composition: 'Ketoconazole', dosage: 'Apply and lather', frequency: '2-3 times/week', durationDays: 14, instructions: 'Allopathic antifungal shampoo.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Regular scalp hygiene'], followUpSuggestions: ['Refer to dermatologist if not improving'], suggestedLabTests: [] },
  },
  {
    keywords: ['obesity', 'overweight', 'weight gain'],
    probableDiagnoses: [{ diagnosis: 'Overweight/Obesity — lifestyle assessment needed', confidence: 0.4 }],
    medicineSuggestions: [],
    clinicalAdvice: { dietRecommendations: ['Balanced calorie-controlled diet — refer to dietitian for individualized plan'], lifestyleRecommendations: ['Regular physical activity'], followUpSuggestions: ['Refer for BMI assessment and screening for associated conditions (thyroid, diabetes)'], suggestedLabTests: ['Thyroid profile, Fasting blood glucose, Lipid profile'] },
  },
  {
    keywords: ['cold sore', 'herpes labialis', 'lip blister'],
    probableDiagnoses: [{ diagnosis: 'Cold sore (Herpes labialis, suspected)', confidence: 0.5 }],
    medicineSuggestions: [
      { brandName: 'Acyclovir 5% cream', composition: 'Acyclovir', dosage: 'Thin layer', frequency: '5 times daily', durationDays: 5, instructions: 'Allopathic topical antiviral, most effective if started early.' },
    ],
    clinicalAdvice: { dietRecommendations: [], lifestyleRecommendations: ['Avoid touching/sharing utensils during active lesion'], followUpSuggestions: ['Refer if frequent recurrences'], suggestedLabTests: [] },
  },
  {
    keywords: ['chikungunya', 'joint pain after fever'],
    probableDiagnoses: [{ diagnosis: 'Chikungunya (suspected) — needs testing', confidence: 0.4 }],
    medicineSuggestions: [
      { brandName: 'Paracetamol 650mg', composition: 'Paracetamol', dosage: '1 tablet', frequency: 'Every 6-8 hours if needed', durationDays: 3, instructions: 'Allopathic — avoid NSAIDs/Aspirin until dengue co-infection is ruled out.' },
    ],
    clinicalAdvice: { dietRecommendations: ['Plenty of fluids'], lifestyleRecommendations: ['Rest, joint protection'], followUpSuggestions: ['Refer for serology testing; joint pain may persist for weeks — needs monitoring'], suggestedLabTests: ['Chikungunya serology'] },
  },
];

const DEFAULT_SUGGESTION = {
  probableDiagnoses: [
    { diagnosis: 'Nonspecific presentation — clinical correlation advised', confidence: 0.3 },
  ],
  medicineSuggestions: [],
  clinicalAdvice: {
    dietRecommendations: ['Maintain adequate hydration'],
    lifestyleRecommendations: ['Adequate rest'],
    followUpSuggestions: ['Doctor to assess further based on examination'],
    suggestedLabTests: [],
  },
};

module.exports = { SYMPTOM_KNOWLEDGE_BASE, DEFAULT_SUGGESTION };