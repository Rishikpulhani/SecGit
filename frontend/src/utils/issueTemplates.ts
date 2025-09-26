interface SecurityIssue {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

export function generateGitHubIssueBody(issue: SecurityIssue, repoUrl: string): string {
  const severityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: '🔍'
  };

  const severityColor = {
    critical: '![Critical](https://img.shields.io/badge/Severity-Critical-red)',
    high: '![High](https://img.shields.io/badge/Severity-High-orange)',
    medium: '![Medium](https://img.shields.io/badge/Severity-Medium-yellow)',
    low: '![Low](https://img.shields.io/badge/Severity-Low-green)'
  };

  return `## ${severityEmoji[issue.severity]} Security Vulnerability Detected

${severityColor[issue.severity]} ![SecGit](https://img.shields.io/badge/Detected%20by-SecGit-blue)

### 🔍 **Issue Description**
${issue.description}

### 📍 **Location**
${issue.file ? `**File:** \`${issue.file}\`` : 'Location not specified'}
${issue.line ? `**Line:** ${issue.line}` : ''}

### 🏷️ **Vulnerability Type**
\`${issue.type}\`

### 🎯 **Severity Level**
**${issue.severity.toUpperCase()}** - ${getSeverityDescription(issue.severity)}

${issue.recommendation ? `### 💡 **Recommended Fix**
${issue.recommendation}` : ''}

### 🔧 **Security Best Practices**
${getSecurityBestPractices(issue.type)}

### 📚 **Additional Resources**
${getAdditionalResources(issue.type)}

---

<details>
<summary>🤖 About this issue</summary>

This security vulnerability was automatically detected by **SecGit** - an AI-powered security analysis platform.

- **Analysis Date:** ${new Date().toLocaleDateString()}
- **Repository:** ${repoUrl}
- **Detection Method:** Automated security scan

For more information about SecGit, visit our platform.
</details>

### ✅ **Next Steps**
1. Review the vulnerability details above
2. Implement the recommended fix
3. Test your changes thoroughly
4. Close this issue once resolved

---
> 🛡️ **Security Tip:** Regularly run security scans to catch vulnerabilities early in your development cycle.`;
}

function getSeverityDescription(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'Immediate action required. This vulnerability poses a severe security risk.';
    case 'high':
      return 'High priority. Should be addressed as soon as possible.';
    case 'medium':
      return 'Medium priority. Should be addressed in the next development cycle.';
    case 'low':
      return 'Low priority. Can be addressed when convenient.';
    default:
      return 'Priority level not specified.';
  }
}

function getSecurityBestPractices(type: string): string {
  const practices = {
    'SQL Injection': `
- Use parameterized queries or prepared statements
- Validate and sanitize all user inputs
- Apply principle of least privilege to database accounts
- Use ORM frameworks with built-in protection`,
    
    'Cross-Site Scripting (XSS)': `
- Sanitize all user inputs before displaying
- Use Content Security Policy (CSP) headers
- Encode output data based on context
- Validate input on both client and server side`,
    
    'Authentication Bypass': `
- Implement proper session management
- Use strong password policies
- Enable multi-factor authentication
- Regularly audit authentication mechanisms`,
    
    'Data Exposure': `
- Encrypt sensitive data at rest and in transit
- Implement proper access controls
- Use secure communication protocols
- Regular security audits and penetration testing`,
    
    'Input Validation': `
- Validate all inputs on server side
- Use whitelist validation where possible
- Implement proper error handling
- Set appropriate length limits`
  };

  return practices[type] || `
- Follow OWASP security guidelines
- Implement defense in depth
- Regular security testing
- Keep dependencies updated`;
}

function getAdditionalResources(type: string): string {
  const resources = {
    'SQL Injection': `
- [OWASP SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)`,
    
    'Cross-Site Scripting (XSS)': `
- [OWASP XSS Prevention](https://owasp.org/www-community/attacks/xss/)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)`,
    
    'Authentication Bypass': `
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)`,
    
    'Data Exposure': `
- [OWASP Data Protection](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)`
  };

  return resources[type] || `
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Code Review Guide](https://owasp.org/www-project-code-review-guide/)`;
}

export function generateIssueTitle(issue: SecurityIssue): string {
  const severityPrefix = {
    critical: '[CRITICAL]',
    high: '[HIGH]',
    medium: '[MEDIUM]',
    low: '[LOW]'
  };

  return `${severityPrefix[issue.severity]} ${issue.type}: ${issue.title}`;
}
