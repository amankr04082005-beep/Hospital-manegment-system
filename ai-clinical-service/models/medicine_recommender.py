"""
Medicine Recommender using Cosine Similarity with pure numpy.
Matches patient symptoms to the best medicine suggestions
from the knowledge base based on keyword overlap and TF-IDF.
"""

import re
import math
import numpy as np
from collections import Counter


class MedicineRecommender:
    """
    Recommends medicines based on symptom-text similarity
    using TF-IDF cosine similarity scoring with pure numpy.
    """

    def __init__(self):
        self._fitted = False
        self._knowledge_base = []
        self._entry_vectors = None
        self._vocabulary = {}
        self._idf = None

    def _tokenize(self, text):
        """Tokenize text into words."""
        tokens = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        return tokens

    def _build_entry_text(self, entry):
        """Build search text from a knowledge base entry."""
        keywords = " ".join(entry.get("keywords", []))
        diagnoses = " ".join(
            d.get("diagnosis", "") for d in entry.get("probableDiagnoses", [])
        )
        medicines = " ".join(
            f"{m.get('brandName', '')} {m.get('genericName', '')} {m.get('composition', '')}"
            for m in entry.get("medicineSuggestions", [])
        )
        advice_text = " ".join(
            entry.get("clinicalAdvice", {}).get("dietRecommendations", [])
        )
        return f"{keywords} {diagnoses} {medicines} {advice_text}"

    def _build_vocabulary(self, texts):
        """Build vocabulary from all texts."""
        all_terms = Counter()
        for text in texts:
            tokens = self._tokenize(text)
            all_terms.update(tokens)

        # Keep top 500 terms
        most_common = all_terms.most_common(500)
        self._vocabulary = {term: idx for idx, (term, _) in enumerate(most_common)}
        return len(self._vocabulary)

    def _tfidf_transform(self, texts):
        """Convert texts to TF-IDF feature matrix."""
        n_docs = len(texts)
        n_features = len(self._vocabulary)
        matrix = np.zeros((n_docs, n_features))

        for doc_idx, text in enumerate(texts):
            tokens = self._tokenize(text)
            term_counts = Counter(tokens)
            n_tokens = len(tokens) if tokens else 1

            for term, count in term_counts.items():
                if term in self._vocabulary:
                    feat_idx = self._vocabulary[term]
                    tf = count / n_tokens
                    matrix[doc_idx, feat_idx] = tf * self._idf[feat_idx]

        return matrix

    def fit(self, knowledge_base):
        """
        Fit the vectorizer on the knowledge base entries.
        """
        self._knowledge_base = knowledge_base
        texts = [self._build_entry_text(entry) for entry in knowledge_base]

        if not texts:
            return

        n_features = self._build_vocabulary(texts)
        if n_features == 0:
            return

        # Compute IDF
        doc_freq = Counter()
        for text in texts:
            unique_terms = set(self._tokenize(text))
            for term in unique_terms:
                if term in self._vocabulary:
                    doc_freq[term] += 1

        n_docs = len(texts)
        self._idf = np.zeros(n_features)
        for term, idx in self._vocabulary.items():
            df = doc_freq.get(term, 1)
            self._idf[idx] = math.log((n_docs + 1) / (df + 1)) + 1.0

        self._entry_vectors = self._tfidf_transform(texts)
        self._fitted = True

    def _cosine_similarity(self, vec1, matrix):
        """Compute cosine similarity between a vector and a matrix."""
        # Normalize the query vector
        norm1 = np.linalg.norm(vec1)
        if norm1 == 0:
            return np.zeros(matrix.shape[0])

        vec1_norm = vec1 / norm1

        # Normalize all row vectors in matrix
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1
        matrix_norm = matrix / norms

        return np.dot(matrix_norm, vec1_norm)

    def recommend(self, symptoms_text, knowledge_base=None, top_k=5):
        """
        Recommend medicines for given symptoms.

        Args:
            symptoms_text (str): Patient's symptom description
            knowledge_base (list, optional): Knowledge base to use
            top_k (int): Maximum number of entries to return

        Returns:
            list: Medicine suggestions from the best-matching entries
        """
        if knowledge_base is not None:
            self.fit(knowledge_base)

        if not self._fitted or not symptoms_text:
            return []

        cleaned = re.sub(r'[^\w\s]', ' ', symptoms_text.lower())
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        if not cleaned:
            return []

        query_vec = self._tfidf_transform([cleaned])[0]
        similarities = self._cosine_similarity(query_vec, self._entry_vectors)

        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        top_indices = top_indices[similarities[top_indices] > 0]

        seen_compositions = set()
        unique_medicines = []

        for idx in top_indices:
            if idx < len(self._knowledge_base):
                entry = self._knowledge_base[idx]
                for med in entry.get("medicineSuggestions", []):
                    comp = med.get("composition", "")
                    if comp and comp not in seen_compositions:
                        seen_compositions.add(comp)
                        unique_medicines.append({
                            **med,
                            "source": "ai_suggested",
                        })

        return unique_medicines

    def get_clinical_advice(self, symptoms_text, knowledge_base=None):
        """
        Get aggregated clinical advice for given symptoms.
        """
        if knowledge_base is not None:
            self.fit(knowledge_base)

        default_advice = {
            "dietRecommendations": ["Maintain adequate hydration"],
            "lifestyleRecommendations": ["Adequate rest"],
            "followUpSuggestions": ["Doctor to assess further based on examination"],
            "suggestedLabTests": [],
        }

        if not self._fitted or not symptoms_text:
            return default_advice

        cleaned = re.sub(r'[^\w\s]', ' ', symptoms_text.lower())
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        if not cleaned:
            return default_advice

        query_vec = self._tfidf_transform([cleaned])[0]
        similarities = self._cosine_similarity(query_vec, self._entry_vectors)
        top_indices = np.argsort(similarities)[::-1][:3]
        top_indices = top_indices[similarities[top_indices] > 0]

        advice = {
            "dietRecommendations": [],
            "lifestyleRecommendations": [],
            "followUpSuggestions": [],
            "suggestedLabTests": [],
        }

        for idx in top_indices:
            if idx < len(self._knowledge_base):
                entry_advice = self._knowledge_base[idx].get("clinicalAdvice", {})
                for key in advice:
                    advice[key].extend(entry_advice.get(key, []))

        for key in advice:
            seen = set()
            unique = []
            for item in advice[key]:
                if item not in seen:
                    seen.add(item)
                    unique.append(item)
            advice[key] = unique

        return advice


_recommender = None


def get_recommender():
    """Get or create the global MedicineRecommender instance."""
    global _recommender
    if _recommender is None:
        _recommender = MedicineRecommender()
    return _recommender
