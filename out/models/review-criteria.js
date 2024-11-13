"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultReviewCriteria = void 0;
exports.defaultReviewCriteria = {
    categories: [
        {
            name: 'Code Quality',
            enabled: true,
            rules: [
                {
                    id: 'code-complexity',
                    name: 'Code Complexity',
                    enabled: true,
                    description: 'Check for complex code structures and suggest simplifications',
                    severity: 'warning'
                },
                {
                    id: 'naming-conventions',
                    name: 'Naming Conventions',
                    enabled: true,
                    description: 'Ensure consistent naming conventions',
                    severity: 'warning'
                }
            ]
        },
        {
            name: 'Security',
            enabled: true,
            rules: [
                {
                    id: 'security-vulnerabilities',
                    name: 'Security Vulnerabilities',
                    enabled: true,
                    description: 'Identify potential security issues',
                    severity: 'error'
                }
            ]
        },
        {
            name: 'Performance',
            enabled: true,
            rules: [
                {
                    id: 'performance-issues',
                    name: 'Performance Issues',
                    enabled: true,
                    description: 'Identify potential performance bottlenecks',
                    severity: 'warning'
                }
            ]
        }
    ]
};
//# sourceMappingURL=review-criteria.js.map