"""
Symptom Classifier using NLP techniques with pure Python + numpy.
Implements TF-IDF vectorization and Naive Bayes classification
using only numpy (no scikit-learn dependency required).
"""

import re
import math
from collections import Counter
import numpy as np


class TfidfVectorizer:
    """Simple TF-IDF vectorizer implementation using numpy."""

    def __init__(self, lowercase=True, max_features=1000):
        self.lowercase = lowercase
        self.max_features = max_features
        self.vocabulary_ = {}
        self.idf_ = None
        self._fitted = False

    def _tokenize(self, text):
        if self.lowercase:
            text = text.lower()
        return re.findall(r'\b[a-zA-Z]+\b', text)

    def fit(self, texts):
        doc_freq = Counter()
        all_terms = Counter()

        for text in texts:
            tokens = self._tokenize(text)
            unique_terms = set(tokens)
            for term in unique_terms:
                doc_freq[term] += 1
            for term in tokens:
                all_terms[term] += 1

        most_common = all_terms.most_common(self.max_features)
        self.vocabulary_ = {term: idx for idx, (term, _) in enumerate(most_common)}

        n_docs = len(texts)
        self.idf_ = np.zeros(len(self.vocabulary_))
        for term, idx in self.vocabulary_.items():
            df = doc_freq.get(term, 1)
            self.idf_[idx] = math.log((n_docs + 1) / (df + 1)) + 1.0

        self._fitted = True
        return self

    def fit_transform(self, texts):
        self.fit(texts)
        return self.transform(texts)

    def transform(self, texts):
        if not self._fitted:
            raise ValueError("Vectorizer not fitted yet")

        n_docs = len(texts)
        n_features = len(self.vocabulary_)
        matrix = np.zeros((n_docs, n_features))

        for doc_idx, text in enumerate(texts):
            tokens = self._tokenize(text)
            term_counts = Counter(tokens)
            n_tokens = len(tokens) if tokens else 1

            for term, count in term_counts.items():
                if term in self.vocabulary_:
                    feat_idx = self.vocabulary_[term]
                    tf = count / n_tokens
                    matrix[doc_idx, feat_idx] = tf * self.idf_[feat_idx]

        return matrix


class MultinomialNB:
    """Multinomial Naive Bayes classifier using numpy."""

    def __init__(self, alpha=1.0):
        self.alpha = alpha
        self.class_log_prior_ = None
        self.feature_log_prob_ = None
        self.classes_ = None
        self._fitted = False

    def fit(self, X, y):
        y_arr = np.array(y)
        self.classes_ = np.unique(y_arr)
        n_classes = len(self.classes_)
        n_features = X.shape[1]

        class_counts = np.zeros(n_classes)
        for i, c in enumerate(self.classes_):
            mask = (y_arr == c)
            class_counts[i] = np.sum(mask)

        self.class_log_prior_ = np.log((class_counts + 1) / (len(y_arr) + n_classes))

        self.feature_log_prob_ = np.zeros((n_classes, n_features))
        for i, c in enumerate(self.classes_):
            mask = (y_arr == c)
            X_c = X[mask]
            if X_c.ndim == 1:
                X_c = X_c.reshape(1, -1)
            feature_sum = np.array(X_c.sum(axis=0)).flatten()
            feature_count = feature_sum + self.alpha
            total_count = feature_count.sum()
            self.feature_log_prob_[i] = np.log(feature_count / total_count)

        self._fitted = True
        return self

    def predict_log_proba(self, X):
        if not self._fitted:
            raise ValueError("Model not fitted yet")

        n_classes = len(self.classes_)
        n_samples = X.shape[0]
        log_probs = np.zeros((n_samples, n_classes))

        for i in range(n_classes):
            log_probs[:, i] = self.class_log_prior_[i] + \
                np.dot(np.array(X), self.feature_log_prob_[i])

        return log_probs

    def predict_proba(self, X):
        log_probs = self.predict_log_proba(X)
        max_log = log_probs.max(axis=1, keepdims=True)
        exp_log = np.exp(log_probs - max_log)
        return exp_log / exp_log.sum(axis=1, keepdims=True)


class SymptomClassifier:
    """ML model that classifies symptom text into probable diagnoses."""

    def __init__(self):
        self.vectorizer = TfidfVectorizer(lowercase=True, max_features=500)
        self.classifier = MultinomialNB(alpha=0.1)
        self._trained = False

    def _prepare_training_data(self, knowledge_base):
        texts = []
        labels = []
        for entry in knowledge_base:
            keyword_text = " ".join(entry["keywords"])
            for diag in entry["probableDiagnoses"]:
                texts.append(keyword_text)
                labels.append(diag["diagnosis"])
        return texts, labels

    def train(self, knowledge_base):
        texts, labels = self._prepare_training_data(knowledge_base)
        if not texts:
            raise ValueError("No training data available")
        X = self.vectorizer.fit_transform(texts)
        self.classifier.fit(X, labels)
        self._trained = True

    def predict(self, symptoms_text):
        if not self._trained:
            return []
        if not symptoms_text or not isinstance(symptoms_text, str):
            return []

        cleaned = re.sub(r'[^\w\s]', ' ', symptoms_text.lower())
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        if not cleaned:
            return []

        X = self.vectorizer.transform([cleaned])
        probs = self.classifier.predict_proba(X)[0]
        classes = self.classifier.classes_

        results = []
        for i, prob in enumerate(probs):
            if prob >= 0.05:
                results.append({
                    "diagnosis": classes[i],
                    "confidence": round(float(prob), 2)
                })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results[:3] if results else []

    def predict_with_fallback(self, symptoms_text, knowledge_base):
        ml_results = self.predict(symptoms_text)
        if ml_results and ml_results[0]["confidence"] >= 0.3:
            return ml_results
        return self._keyword_match(symptoms_text, knowledge_base)

    def _keyword_match(self, symptoms_text, knowledge_base):
        if not symptoms_text:
            return []
        lower_text = symptoms_text.lower()
        results = []

        for entry in knowledge_base:
            matched_keywords = [kw for kw in entry["keywords"] if kw in lower_text]
            if matched_keywords:
                match_ratio = len(matched_keywords) / max(len(entry["keywords"]), 1)
                for diag in entry["probableDiagnoses"]:
                    adjusted_confidence = diag["confidence"] * (0.5 + 0.5 * match_ratio)
                    results.append({
                        "diagnosis": diag["diagnosis"],
                        "confidence": round(min(adjusted_confidence, 0.99), 2)
                    })

        if not results:
            return []
        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results[:3]

    @property
    def is_trained(self):
        return self._trained


_classifier = None


def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = SymptomClassifier()
    return _classifier
