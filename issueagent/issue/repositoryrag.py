# repositoryrag.py  
import re
from hyperon import MeTTa, E, S, ValueAtom

class RepositoryRAG:
    def __init__(self, metta_instance: MeTTa):
        self.metta = metta_instance

    def query_project_features(self, project_type):
        """Find features linked to a project type (like query_symptom in medical agent)."""
        project_type = project_type.strip('"')
        query_str = f'!(match &self (project_type {project_type} $feature) $feature)'
        results = self.metta.run(query_str)
        print(f"Project features query results: {results}, query: {query_str}")

        # Extract all features from the nested MeTTa result structure
        all_features = []
        if results:
            for result_item in results:
                if isinstance(result_item, list):
                    # Handle nested list results
                    for item in result_item:
                        feature_str = str(item).strip()
                        if feature_str and feature_str not in all_features:
                            all_features.append(feature_str)
                else:
                    # Handle direct results
                    feature_str = str(result_item).strip()
                    if feature_str and feature_str not in all_features:
                        all_features.append(feature_str)
        
        print(f"Extracted features: {all_features}")
        return all_features

    def get_feature_description(self, feature_name):
        """Find description for a feature (like get_treatment in medical agent)."""
        feature_name = feature_name.strip('"')
        query_str = f'!(match &self (feature {feature_name} $description) $description)'
        results = self.metta.run(query_str)
        print(f"Feature description query results: {results}, query: {query_str}")
        
        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def add_knowledge(self, relation_type, subject, object_value):
        """Add new knowledge dynamically (same as medical agent)."""
        if isinstance(object_value, str):
            object_value = ValueAtom(object_value)
        self.metta.space().add_atom(E(S(relation_type), S(subject), object_value))
        return f"Added {relation_type}: {subject} → {object_value}"
