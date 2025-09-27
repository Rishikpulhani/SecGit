// Utility functions for consistent label styling across the platform

export const getTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'bug':
      return 'github-label-bug';
    case 'enhancement':
    case 'feature':
      return 'github-label-enhancement';
    case 'security':
      return 'github-label-security';
    default:
      return 'github-label-default';
  }
};

export const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'low':
    case 'easy':
      return 'github-label-low';
    case 'medium':
      return 'github-label-medium';
    case 'high':
    case 'hard':
      return 'github-label-high';
    case 'critical':
      return 'github-label-critical';
    default:
      return 'github-label-medium';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'github-label-open';
    case 'closed':
      return 'github-label-closed';
    case 'in-progress':
    case 'in_progress':
      return 'github-label-in-progress';
    default:
      return 'github-label-default';
  }
};

export const getSpecialLabelColor = (label: string): string => {
  switch (label.toLowerCase()) {
    case 'ai-generated':
    case 'ai generated':
      return 'github-label-ai-generated';
    case 'manual':
      return 'github-label-manual';
    case 'bounty':
      return 'github-label-bounty';
    case 'enhancement':
    case 'feature':
      return 'github-label-enhancement';
    case 'bug':
      return 'github-label-bug';
    case 'security':
      return 'github-label-security';
    case 'api':
      return 'github-label-feature';
    default:
      return 'github-label-default';
  }
};

// Helper function to get the best label class for any label text
export const getLabelClass = (labelText: string, context?: 'type' | 'severity' | 'status' | 'special'): string => {
  if (!context) {
    // Auto-detect context based on label text
    const lowerLabel = labelText.toLowerCase();
    
    // Check if it's a type
    if (['bug', 'enhancement', 'feature', 'security'].includes(lowerLabel)) {
      return getTypeColor(lowerLabel);
    }
    
    // Check if it's a severity
    if (['low', 'easy', 'medium', 'high', 'hard', 'critical'].includes(lowerLabel)) {
      return getSeverityColor(lowerLabel);
    }
    
    // Check if it's a status
    if (['open', 'closed', 'in-progress', 'in_progress'].includes(lowerLabel)) {
      return getStatusColor(lowerLabel);
    }
    
    // Default to special label detection
    return getSpecialLabelColor(lowerLabel);
  }
  
  switch (context) {
    case 'type':
      return getTypeColor(labelText);
    case 'severity':
      return getSeverityColor(labelText);
    case 'status':
      return getStatusColor(labelText);
    case 'special':
    default:
      return getSpecialLabelColor(labelText);
  }
};
