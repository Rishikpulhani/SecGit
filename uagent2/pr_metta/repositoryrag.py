# pr_rag.py - RAG system for Pull Request analysis
import re
from hyperon import MeTTa, E, S, ValueAtom

class PullRequestRAG:
    def __init__(self, metta_instance: MeTTa):
        self.metta = metta_instance

    def query_pr_analysis_areas(self, pr_type):
        """Find analysis areas for a specific PR type."""
        pr_type = pr_type.strip('"')
        query_str = f'!(match &self (pr_type {pr_type} $analysis) $analysis)'
        results = self.metta.run(query_str)
        print(f"PR analysis areas query results: {results}, query: {query_str}")

        # Extract all analysis areas from the nested MeTTa result structure
        all_areas = []
        if results:
            for result_item in results:
                if isinstance(result_item, list):
                    # Handle nested list results
                    for item in result_item:
                        area_str = str(item).strip()
                        if area_str and area_str not in all_areas:
                            all_areas.append(area_str)
                else:
                    # Handle direct results
                    area_str = str(result_item).strip()
                    if area_str and area_str not in all_areas:
                        all_areas.append(area_str)
        
        print(f"Extracted analysis areas: {all_areas}")
        return all_areas

    def get_analysis_description(self, analysis_area):
        """Find description for an analysis area."""
        analysis_area = analysis_area.strip('"')
        query_str = f'!(match &self (analysis {analysis_area} $description) $description)'
        results = self.metta.run(query_str)
        print(f"Analysis description query results: {results}, query: {query_str}")
        
        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def classify_pr_by_files(self, file_changes):
        """Classify PR type based on changed files."""
        pr_types = []
        
        for file_path in file_changes:
            file_lower = file_path.lower()
            
            # Query file patterns to determine PR type
            for pattern in ['test', 'spec', 'README', 'doc', 'security', 'auth', 'perf', 'benchmark']:
                if pattern.lower() in file_lower:
                    query_str = f'!(match &self (file_pattern {pattern} $type) $type)'
                    results = self.metta.run(query_str)
                    
                    if results:
                        for result_item in results:
                            if isinstance(result_item, list):
                                for item in result_item:
                                    pr_type = str(item).strip()
                                    if pr_type and pr_type not in pr_types:
                                        pr_types.append(pr_type)
                            else:
                                pr_type = str(result_item).strip()
                                if pr_type and pr_type not in pr_types:
                                    pr_types.append(pr_type)
        
        # Default to feature if no specific pattern matches
        if not pr_types:
            pr_types = ['feature']
        
        print(f"Classified PR types based on files: {pr_types}")
        return pr_types

    def analyze_pr_title_description(self, title, description):
        """Analyze PR title and description to classify type."""
        pr_types = []
        
        combined_text = f"{title} {description}".lower()
        
        # Keywords for different PR types
        type_keywords = {
            'bugfix': ['fix', 'bug', 'issue', 'error', 'problem', 'resolve'],
            'feature': ['add', 'new', 'implement', 'feature', 'enhance'],
            'refactor': ['refactor', 'restructure', 'reorganize', 'cleanup'],
            'docs': ['documentation', 'readme', 'docs', 'guide'],
            'security': ['security', 'vulnerability', 'auth', 'permission'],
            'performance': ['performance', 'optimize', 'speed', 'benchmark']
        }
        
        for pr_type, keywords in type_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                pr_types.append(pr_type)
        
        # Default to feature if no keywords match
        if not pr_types:
            pr_types = ['feature']
        
        print(f"Classified PR types from title/description: {pr_types}")
        return pr_types

    def get_comprehensive_analysis_plan(self, pr_data):
        """Get comprehensive analysis plan for a PR."""
        title = pr_data.get('title', '')
        description = pr_data.get('body', '')
        file_changes = pr_data.get('changed_files', [])
        
        # Classify PR type using multiple methods
        title_types = self.analyze_pr_title_description(title, description)
        file_types = self.classify_pr_by_files(file_changes)
        
        # Combine and deduplicate types
        all_types = list(set(title_types + file_types))
        
        # Get analysis areas for all identified types
        analysis_plan = []
        for pr_type in all_types:
            areas = self.query_pr_analysis_areas(pr_type)
            for area in areas:
                descriptions = self.get_analysis_description(area)
                if descriptions:
                    analysis_plan.append({
                        'area': area,
                        'description': descriptions[0],
                        'pr_type': pr_type
                    })
        
        return {
            'pr_types': all_types,
            'analysis_plan': analysis_plan
        }

    def add_pr_knowledge(self, relation_type, subject, object_value):
        """Add new PR analysis knowledge dynamically."""
        if isinstance(object_value, str):
            object_value = ValueAtom(object_value)
        self.metta.space().add_atom(E(S(relation_type), S(subject), object_value))
        return f"Added {relation_type}: {subject} → {object_value}"