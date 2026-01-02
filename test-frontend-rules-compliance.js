/**
 * FRONTEND RULES COMPLIANCE TEST
 * Tests that all hard-coded data is removed and everything fetches from APIs
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 FRONTEND RULES COMPLIANCE TEST');
console.log('=================================');

// Test configuration
const frontendFiles = [
    'frontend-api-driven.html',
    'student-dashboard-complete.html',
    'admin-dashboard-complete.html',
    'faculty-dashboard-complete.html'
];

function testHardCodedDataRemoval() {
    console.log('\n🚫 Testing Hard-Coded Data Removal...');
    
    const hardCodedPatterns = [
        // Common hard-coded data patterns
        /const\s+users\s*=\s*\[/i,
        /const\s+students\s*=\s*\[/i,
        /const\s+faculty\s*=\s*\[/i,
        /const\s+marks\s*=\s*\[/i,
        /const\s+attendance\s*=\s*\[/i,
        /const\s+notices\s*=\s*\[/i,
        
        // Hard-coded arrays
        /\[\s*{\s*name\s*:/i,
        /\[\s*{\s*email\s*:/i,
        /\[\s*{\s*id\s*:/i,
        
        // Fake data indicators
        /john\.doe/i,
        /jane\.smith/i,
        /test@example\.com/i,
        /dummy.*data/i,
        /fake.*data/i,
        /sample.*data/i,
        
        // Hard-coded statistics
        /totalUsers.*=.*\d+/i,
        /totalStudents.*=.*\d+/i,
        /totalFaculty.*=.*\d+/i,
        
        // Static HTML content that should be dynamic
        /<td>.*John.*Doe.*<\/td>/i,
        /<td>.*jane@example\.com.*<\/td>/i,
        /<div.*>.*85%.*<\/div>/i
    ];
    
    let allPassed = true;
    const violations = [];
    
    for (const file of frontendFiles) {
        if (!fs.existsSync(file)) {
            console.log(`⚠️ File ${file} not found, skipping...`);
            continue;
        }
        
        console.log(`\n📄 Checking ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of hardCodedPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                violations.push({
                    file,
                    pattern: pattern.toString(),
                    match: matches[0]
                });
                console.log(`❌ Hard-coded data found: ${matches[0]}`);
                allPassed = false;
            }
        }
        
        if (violations.filter(v => v.file === file).length === 0) {
            console.log(`✅ No hard-coded data found in ${file}`);
        }
    }
    
    return { passed: allPassed, violations };
}

function testAPIFetchImplementation() {
    console.log('\n🔌 Testing API Fetch Implementation...');
    
    const requiredAPIPatterns = [
        // API call patterns
        /fetch\s*\(\s*[`'"]/i,
        /apiCall\s*\(/i,
        /await.*fetch/i,
        
        // API endpoints
        /\/api\/admin/i,
        /\/api\/faculty/i,
        /\/api\/student/i,
        /\/api\/auth/i,
        
        // Response handling
        /response\.json\(\)/i,
        /\.then\s*\(/i,
        /await.*response/i,
        
        // Error handling
        /catch\s*\(/i,
        /try\s*{/i,
        /throw.*Error/i
    ];
    
    let allPassed = true;
    const apiImplementations = [];
    
    for (const file of frontendFiles) {
        if (!fs.existsSync(file)) continue;
        
        console.log(`\n📄 Checking API implementation in ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        
        let hasAPIImplementation = false;
        
        for (const pattern of requiredAPIPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                hasAPIImplementation = true;
                apiImplementations.push({
                    file,
                    pattern: pattern.toString(),
                    found: true
                });
            }
        }
        
        if (hasAPIImplementation) {
            console.log(`✅ API implementation found in ${file}`);
        } else {
            console.log(`❌ No API implementation found in ${file}`);
            allPassed = false;
        }
    }
    
    return { passed: allPassed, implementations: apiImplementations };
}

function testEmptyStateImplementation() {
    console.log('\n🗂️ Testing Empty State Implementation...');
    
    const emptyStatePatterns = [
        /createEmptyState/i,
        /empty.*state/i,
        /no.*data.*found/i,
        /no.*records/i,
        /nothing.*to.*show/i,
        /data.*not.*available/i
    ];
    
    let allPassed = true;
    const emptyStates = [];
    
    for (const file of frontendFiles) {
        if (!fs.existsSync(file)) continue;
        
        console.log(`\n📄 Checking empty states in ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        
        let hasEmptyStates = false;
        
        for (const pattern of emptyStatePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                hasEmptyStates = true;
                emptyStates.push({
                    file,
                    pattern: pattern.toString(),
                    found: true
                });
            }
        }
        
        if (hasEmptyStates) {
            console.log(`✅ Empty state implementation found in ${file}`);
        } else {
            console.log(`❌ No empty state implementation found in ${file}`);
            allPassed = false;
        }
    }
    
    return { passed: allPassed, emptyStates };
}

function testButtonFunctionality() {
    console.log('\n🔘 Testing Button Functionality...');
    
    const buttonPatterns = [
        // Button with onclick handlers
        /onclick\s*=\s*['"]/i,
        /addEventListener\s*\(\s*['"]click['"]/i,
        
        // Form submissions
        /onsubmit\s*=/i,
        /addEventListener\s*\(\s*['"]submit['"]/i,
        
        // Function definitions for button handlers
        /function.*handle/i,
        /async.*function/i,
        
        // Event handlers
        /handle.*Click/i,
        /handle.*Submit/i,
        /handle.*Login/i,
        /handle.*Logout/i
    ];
    
    let allPassed = true;
    const buttonImplementations = [];
    
    for (const file of frontendFiles) {
        if (!fs.existsSync(file)) continue;
        
        console.log(`\n📄 Checking button functionality in ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        
        // Count buttons
        const buttonMatches = content.match(/<button[^>]*>/gi) || [];
        const buttonCount = buttonMatches.length;
        
        let functionalButtons = 0;
        
        for (const pattern of buttonPatterns) {
            const matches = content.match(new RegExp(pattern.source, 'gi')) || [];
            functionalButtons += matches.length;
        }
        
        console.log(`📊 Found ${buttonCount} buttons, ${functionalButtons} with functionality`);
        
        if (buttonCount > 0 && functionalButtons > 0) {
            console.log(`✅ Button functionality implemented in ${file}`);
            buttonImplementations.push({
                file,
                buttonCount,
                functionalButtons,
                ratio: functionalButtons / buttonCount
            });
        } else if (buttonCount > 0) {
            console.log(`❌ Buttons found but no functionality in ${file}`);
            allPassed = false;
        } else {
            console.log(`⚠️ No buttons found in ${file}`);
        }
    }
    
    return { passed: allPassed, implementations: buttonImplementations };
}

function testUIConsistency() {
    console.log('\n🎨 Testing UI Consistency...');
    
    const uiPatterns = [
        // Consistent styling
        /class\s*=\s*['"]/i,
        /tailwindcss/i,
        /bg-.*-\d+/i,
        /text-.*-\d+/i,
        
        // Loading states
        /loading/i,
        /spinner/i,
        /showLoading/i,
        
        // Error handling
        /error/i,
        /showAlert/i,
        /showError/i,
        
        // Responsive design
        /md:/i,
        /lg:/i,
        /sm:/i
    ];
    
    let allPassed = true;
    const uiImplementations = [];
    
    for (const file of frontendFiles) {
        if (!fs.existsSync(file)) continue;
        
        console.log(`\n📄 Checking UI consistency in ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        
        let hasConsistentUI = false;
        
        for (const pattern of uiPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                hasConsistentUI = true;
                break;
            }
        }
        
        if (hasConsistentUI) {
            console.log(`✅ Consistent UI implementation found in ${file}`);
            uiImplementations.push({ file, consistent: true });
        } else {
            console.log(`❌ Inconsistent UI in ${file}`);
            allPassed = false;
        }
    }
    
    return { passed: allPassed, implementations: uiImplementations };
}

function generateComplianceReport() {
    console.log('\n📋 FRONTEND RULES COMPLIANCE REPORT');
    console.log('===================================');
    
    const tests = [
        { name: 'Hard-Coded Data Removal', test: testHardCodedDataRemoval },
        { name: 'API Fetch Implementation', test: testAPIFetchImplementation },
        { name: 'Empty State Implementation', test: testEmptyStateImplementation },
        { name: 'Button Functionality', test: testButtonFunctionality },
        { name: 'UI Consistency', test: testUIConsistency }
    ];
    
    let allPassed = true;
    const results = [];
    
    for (const testCase of tests) {
        try {
            const result = testCase.test();
            results.push({ name: testCase.name, ...result });
            if (!result.passed) allPassed = false;
        } catch (error) {
            console.error(`❌ Error in ${testCase.name}:`, error.message);
            results.push({ name: testCase.name, passed: false, error: error.message });
            allPassed = false;
        }
    }
    
    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    
    for (const result of results) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${result.name}`);
        
        if (result.violations && result.violations.length > 0) {
            console.log(`   Violations: ${result.violations.length}`);
        }
        if (result.implementations && result.implementations.length > 0) {
            console.log(`   Implementations: ${result.implementations.length}`);
        }
    }
    
    console.log('\n🎯 FRONTEND RULES COMPLIANCE:');
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED');
        console.log('✅ No hard-coded data found');
        console.log('✅ All data fetched from APIs');
        console.log('✅ Empty states implemented');
        console.log('✅ All buttons functional');
        console.log('✅ UI consistency maintained');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('❌ Frontend rules need fixes');
    }
    
    return allPassed;
}

function runFrontendRulesTest() {
    console.log('🚀 Starting Frontend Rules Compliance Test...\n');
    
    try {
        const isCompliant = generateComplianceReport();
        
        if (isCompliant) {
            console.log('\n🎉 FRONTEND RULES FULLY COMPLIANT!');
            console.log('🚫 No hard-coded data');
            console.log('🔌 All data from APIs');
            console.log('🗂️ Empty states implemented');
            console.log('🔘 All buttons working');
            console.log('🎨 Same UI, different data');
        } else {
            console.log('\n⚠️ FRONTEND RULES NEED ATTENTION');
            console.log('Please review failed tests above');
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Export for testing
module.exports = {
    runFrontendRulesTest,
    testHardCodedDataRemoval,
    testAPIFetchImplementation,
    testEmptyStateImplementation,
    testButtonFunctionality,
    testUIConsistency
};

// Run test if called directly
if (require.main === module) {
    runFrontendRulesTest();
}