# pr_knowledge.py - Knowledge graph for Pull Request analysis
from hyperon import MeTTa, E, S, ValueAtom

def initialize_pr_knowledge_graph(metta: MeTTa):
    """Initialize the MeTTa knowledge graph with PR analysis patterns."""
    
    # PR Type → Analysis Focus Areas
    
    # Feature PRs
    metta.space().add_atom(E(S("pr_type"), S("feature"), S("functionality_review")))
    metta.space().add_atom(E(S("pr_type"), S("feature"), S("code_quality_check")))
    metta.space().add_atom(E(S("pr_type"), S("feature"), S("test_coverage")))
    metta.space().add_atom(E(S("pr_type"), S("feature"), S("documentation_update")))
    
    # Bug Fix PRs
    metta.space().add_atom(E(S("pr_type"), S("bugfix"), S("root_cause_analysis")))
    metta.space().add_atom(E(S("pr_type"), S("bugfix"), S("regression_testing")))
    metta.space().add_atom(E(S("pr_type"), S("bugfix"), S("edge_case_handling")))
    
    # Refactoring PRs
    metta.space().add_atom(E(S("pr_type"), S("refactor"), S("code_structure_improvement")))
    metta.space().add_atom(E(S("pr_type"), S("refactor"), S("performance_impact")))
    metta.space().add_atom(E(S("pr_type"), S("refactor"), S("maintainability_check")))
    
    # Documentation PRs
    metta.space().add_atom(E(S("pr_type"), S("docs"), S("content_clarity")))
    metta.space().add_atom(E(S("pr_type"), S("docs"), S("technical_accuracy")))
    metta.space().add_atom(E(S("pr_type"), S("docs"), S("completeness_check")))
    
    # Security PRs
    metta.space().add_atom(E(S("pr_type"), S("security"), S("vulnerability_assessment")))
    metta.space().add_atom(E(S("pr_type"), S("security"), S("security_best_practices")))
    metta.space().add_atom(E(S("pr_type"), S("security"), S("access_control_review")))
    
    # Performance PRs
    metta.space().add_atom(E(S("pr_type"), S("performance"), S("benchmark_analysis")))
    metta.space().add_atom(E(S("pr_type"), S("performance"), S("resource_usage")))
    metta.space().add_atom(E(S("pr_type"), S("performance"), S("scalability_impact")))
    
    # Analysis Focus → Description
    
    # Feature Analysis
    metta.space().add_atom(E(S("analysis"), S("functionality_review"), ValueAtom("Review the new functionality for correctness and completeness")))
    metta.space().add_atom(E(S("analysis"), S("code_quality_check"), ValueAtom("Assess code quality, readability, and adherence to standards")))
    metta.space().add_atom(E(S("analysis"), S("test_coverage"), ValueAtom("Verify adequate test coverage for new functionality")))
    metta.space().add_atom(E(S("analysis"), S("documentation_update"), ValueAtom("Check if documentation is updated for new features")))
    
    # Bug Fix Analysis
    metta.space().add_atom(E(S("analysis"), S("root_cause_analysis"), ValueAtom("Analyze if the root cause of the bug is properly addressed")))
    metta.space().add_atom(E(S("analysis"), S("regression_testing"), ValueAtom("Ensure the fix doesn't introduce new issues")))
    metta.space().add_atom(E(S("analysis"), S("edge_case_handling"), ValueAtom("Verify edge cases and error conditions are handled")))
    
    # Refactoring Analysis
    metta.space().add_atom(E(S("analysis"), S("code_structure_improvement"), ValueAtom("Evaluate improvements in code organization and structure")))
    metta.space().add_atom(E(S("analysis"), S("performance_impact"), ValueAtom("Assess potential performance implications of refactoring")))
    metta.space().add_atom(E(S("analysis"), S("maintainability_check"), ValueAtom("Review how changes improve code maintainability")))
    
    # Documentation Analysis
    metta.space().add_atom(E(S("analysis"), S("content_clarity"), ValueAtom("Check documentation clarity and understandability")))
    metta.space().add_atom(E(S("analysis"), S("technical_accuracy"), ValueAtom("Verify technical accuracy of documentation changes")))
    metta.space().add_atom(E(S("analysis"), S("completeness_check"), ValueAtom("Ensure documentation covers all necessary aspects")))
    
    # Security Analysis
    metta.space().add_atom(E(S("analysis"), S("vulnerability_assessment"), ValueAtom("Assess potential security vulnerabilities in changes")))
    metta.space().add_atom(E(S("analysis"), S("security_best_practices"), ValueAtom("Verify adherence to security best practices")))
    metta.space().add_atom(E(S("analysis"), S("access_control_review"), ValueAtom("Review access control and permission changes")))
    
    # Performance Analysis
    metta.space().add_atom(E(S("analysis"), S("benchmark_analysis"), ValueAtom("Analyze performance benchmarks and improvements")))
    metta.space().add_atom(E(S("analysis"), S("resource_usage"), ValueAtom("Review resource usage implications of changes")))
    metta.space().add_atom(E(S("analysis"), S("scalability_impact"), ValueAtom("Assess impact on system scalability")))
    
    # File Pattern → PR Type Classification
    metta.space().add_atom(E(S("file_pattern"), S("test"), S("feature")))
    metta.space().add_atom(E(S("file_pattern"), S("spec"), S("feature")))
    metta.space().add_atom(E(S("file_pattern"), S("README"), S("docs")))
    metta.space().add_atom(E(S("file_pattern"), S("doc"), S("docs")))
    metta.space().add_atom(E(S("file_pattern"), S("security"), S("security")))
    metta.space().add_atom(E(S("file_pattern"), S("auth"), S("security")))
    metta.space().add_atom(E(S("file_pattern"), S("perf"), S("performance")))
    metta.space().add_atom(E(S("file_pattern"), S("benchmark"), S("performance")))
    
    print("✅ PR Knowledge graph initialized with analysis patterns")