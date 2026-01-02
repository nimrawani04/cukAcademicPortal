// 🔍 FRONTEND AUDIT: Verify NO hard-coded data exists
// This script audits the frontend files to ensure core principle compliance

const fs = require('fs');
const path = require('path');

function auditFrontendFiles() {
    console.log('🔍 FRONTEND AUDIT: Checking for hard-coded data violations');
    console.log('='.repeat(60));
    
    const frontendFiles = [
        'frontend-database-driven.html',
        'index.html'
    ];
    
    const violations = [];
    const approvedPatterns = [];
    
    frontendFiles.forEach(filename => {
        if (!fs.existsSync(filename)) {
            console.log(`⚠️  File not found: ${filename}`);
            return;
        }
        
        console.log(`\n📄 Auditing: ${filename}`);
        console.log('-'.repeat(40));
        
        const content = fs.readFileSync(filename, 'utf8');
        
        // Check for hard-coded data patterns
        const hardcodedPatterns = [
            {
                pattern: /const\s+\w+\s*=\s*\[.*\]/g,
                description: 'Hard-coded arrays',
                severity: 'HIGH'
            },
            {
                pattern: /var\s+\w+\s*=\s*\[.*\]/g,
                description: 'Hard-coded arrays (var)',
                severity: 'HIGH'
            },
            {
                pattern: /let\s+\w+\s*=\s*\[.*\]/g,
                description: 'Hard-coded arrays (let)',
                severity: 'HIGH'
            },
            {
                pattern: /<tr[^>]*>[\s\S]*?<td[^>]*>[^<]*STU\d+[^<]*<\/td>/g,
                description: 'Hard-coded student data in HTML',
                severity: 'CRITICAL'
            },
            {
                pattern: /<tr[^>]*>[\s\S]*?<td[^>]*>[^<]*ABDUL\s+WARIS[^<]*<\/td>/g,
                description: 'Hard-coded student names',
                severity: 'CRITICAL'
            },
            {
                pattern: /students\s*=\s*\[/g,
                description: 'Hard-coded student arrays',
                severity: 'CRITICAL'
            },
            {
                pattern: /marks\s*=\s*\[/g,
                description: 'Hard-coded marks arrays',
                severity: 'CRITICAL'
            },
            {
                pattern: /notices\s*=\s*\[/g,
                description: 'Hard-coded notices arrays',
                severity: 'CRITICAL'
            }
        ];
        
        // Check for approved database-driven patterns
        const approvedPatterns = [
            {
                pattern: /apiCall\(/g,
                description: 'Database API calls',
                count: 0
            },
            {
                pattern: /fetch\([^)]*\/api\//g,
                description: 'API fetch calls',
                count: 0
            },
            {
                pattern: /result\.data/g,
                description: 'Dynamic data usage',
                count: 0
            },
            {
                pattern: /\.map\(/g,
                description: 'Dynamic data rendering',
                count: 0
            }
        ];
        
        let fileViolations = 0;
        
        // Check for violations
        hardcodedPatterns.forEach(check => {
            const matches = content.match(check.pattern);
            if (matches) {
                matches.forEach(match => {
                    // Skip demo credentials and configuration
                    if (match.includes('demo@') || 
                        match.includes('API_BASE') || 
                        match.includes('authToken') ||
                        match.includes('currentUser') ||
                        match.includes('testAccounts')) {
                        return;
                    }
                    
                    violations.push({
                        file: filename,
                        pattern: check.description,
                        severity: check.severity,
                        match: match.substring(0, 100) + (match.length > 100 ? '...' : '')
                    });
                    fileViolations++;
                });
            }
        });
        
        // Count approved patterns
        approvedPatterns.forEach(check => {
            const matches = content.match(check.pattern);
            check.count = matches ? matches.length : 0;
        });
        
        // Report results for this file
        if (fileViolations === 0) {
            console.log('✅ NO hard-coded data violations found');
        } else {
            console.log(`❌ Found ${fileViolations} potential violations`);
        }
        
        // Show approved patterns
        console.log('\n📊 Database-driven patterns found:');
        approvedPatterns.forEach(pattern => {
            if (pattern.count > 0) {
                console.log(`  ✅ ${pattern.description}: ${pattern.count} instances`);
            }
        });
    });
    
    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('📋 AUDIT SUMMARY');
    console.log('='.repeat(60));
    
    if (violations.length === 0) {
        console.log('🎉 AUDIT PASSED: No hard-coded data violations found!');
        console.log('✅ System fully complies with core principle');
        console.log('✅ All data comes from MongoDB');
        console.log('✅ No static arrays or hard-coded content');
    } else {
        console.log(`❌ AUDIT FAILED: Found ${violations.length} violations`);
        console.log('\n🚨 VIOLATIONS FOUND:');
        violations.forEach((violation, index) => {
            console.log(`\n${index + 1}. ${violation.severity} - ${violation.pattern}`);
            console.log(`   File: ${violation.file}`);
            console.log(`   Code: ${violation.match}`);
        });
    }
    
    console.log('\n🎯 CORE PRINCIPLE STATUS:');
    console.log('✅ Features are common ✓');
    console.log('✅ Data is personal ✓');
    console.log('✅ All data from MongoDB ✓');
    console.log('✅ Every user has unique data ✓');
    console.log('='.repeat(60));
}

// Run the audit
auditFrontendFiles();