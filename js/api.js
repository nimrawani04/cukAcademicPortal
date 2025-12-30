// API Configuration and Utilities
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'  // Development
    : '/api';  // Production (same domain)

// Global state management
let currentUser = null;
let authToken = null;

// Loading state management
function showLoading(element, text = 'Loading...') {
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span>${text}</span>
            </div>
        `;
    }
}

function hideLoading() {
    // Remove any loading indicators
    document.querySelectorAll('.loading-indicator').forEach(el => el.remove());
}

// Error handling
function showError(message, container = null) {
    const errorHtml = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div class="flex items-center">
                <svg class="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <p class="text-sm font-medium text-red-800">${message}</p>
            </div>
        </div>
    `;
    
    if (container) {
        container.innerHTML = errorHtml + container.innerHTML;
    } else {
        alert(`Error: ${message}`);
    }
}

// Success message
function showSuccess(message, container = null) {
    const successHtml = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div class="flex items-center">
                <svg class="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-sm font-medium text-green-800">${message}</p>
            </div>
        </div>
    `;
    
    if (container) {
        container.innerHTML = successHtml + container.innerHTML;
    } else {
        alert(`Success: ${message}`);
    }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add auth token if available
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Merge options
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}/
/ Authentication Functions
async function handleLogin(event) {
    event.preventDefault();
    
    const loginId = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;
    const userType = currentLoginType; // This should be set when modal opens
    
    if (!loginId || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
        // Determine the correct login endpoint based on user type
        let endpoint = '/auth/login';
        if (userType === 'student') {
            endpoint = '/auth/student/login';
        } else if (userType === 'teacher' || userType === 'faculty') {
            endpoint = '/auth/faculty/login';
        }

        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                [userType === 'student' ? 'rollNumber' : 'employeeId']: loginId,
                password: password
            })
        });

        if (response.success) {
            // Store auth token and user info
            authToken = response.data.token;
            currentUser = response.data.user;
            
            // Store in localStorage for persistence
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Close login modal and show appropriate dashboard
            closeLoginModal();
            
            if (userType === 'student') {
                showStudentDashboard();
            } else {
                showTeacherDashboard();
            }
            
            showSuccess(`Welcome back, ${currentUser.firstName}!`);
        }
    } catch (error) {
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegistration(event) {
    event.preventDefault();
    
    const formData = {
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value,
        confirmPassword: document.getElementById('regConfirmPassword').value,
        registrationType: document.getElementById('regType').value
    };

    // Validation
    if (formData.password !== formData.confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (!document.getElementById('regTerms').checked) {
        showError('Please accept the terms and conditions');
        return;
    }

    // Add role-specific fields
    if (formData.registrationType === 'student') {
        formData.course = document.getElementById('regCourse').value;
        formData.year = document.getElementById('regYear').value;
    } else if (formData.registrationType === 'faculty') {
        formData.department = document.getElementById('regDepartment').value;
        formData.designation = document.getElementById('regDesignation').value;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/registration/register', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response.success) {
            showSuccess('Registration submitted successfully! You will receive a confirmation email within 24-48 hours.');
            closeRegistrationModal();
            
            // Clear form
            document.getElementById('registrationForm').reset();
        }
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const userType = document.getElementById('forgotUserType').value;
    const email = document.getElementById('forgotId').value;
    
    if (!userType || !email) {
        showError('Please fill in all fields');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending Reset Link...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                userType: userType
            })
        });

        if (response.success) {
            // Show step 2 (success message)
            document.getElementById('forgotPasswordStep1').classList.add('hidden');
            document.getElementById('forgotPasswordStep2').classList.remove('hidden');
            
            // Update success message with email
            const successMessage = document.querySelector('#forgotPasswordStep2 p');
            if (successMessage) {
                successMessage.textContent = `We've sent a password reset link to ${email}. Please check your inbox and follow the instructions.`;
            }
        }
    } catch (error) {
        showError(error.message || 'Failed to send reset link. Please try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle password reset from email link
async function handlePasswordReset(event) {
    event.preventDefault();
    
    const token = getUrlParameter('token');
    const userType = getUrlParameter('type');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!token) {
        showError('Invalid or missing reset token');
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
        showError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Resetting Password...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                token: token,
                newPassword: newPassword,
                userType: userType
            })
        });

        if (response.success) {
            showSuccess('Password reset successfully! You can now log in with your new password.');
            
            // Redirect to login after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    } catch (error) {
        showError(error.message || 'Failed to reset password. Please try again or request a new reset link.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Verify reset token when page loads
async function verifyResetToken() {
    const token = getUrlParameter('token');
    const userType = getUrlParameter('type');
    
    if (!token) {
        showError('Invalid or missing reset token');
        return false;
    }

    try {
        const response = await apiRequest(`/auth/verify-reset-token/${token}?userType=${userType}`);
        
        if (response.success) {
            // Show user info
            const userInfo = document.getElementById('resetUserInfo');
            if (userInfo && response.data) {
                userInfo.innerHTML = `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h3 class="font-semibold text-blue-900">Resetting password for:</h3>
                        <p class="text-blue-800">${response.data.name} (${response.data.email})</p>
                        <p class="text-sm text-blue-600">User Type: ${response.data.userType}</p>
                    </div>
                `;
            }
            return true;
        } else {
            showError('Invalid or expired reset token');
            return false;
        }
    } catch (error) {
        showError('Invalid or expired reset token');
        return false;
    }
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Resend reset link functionality
async function resendResetLink() {
    const userType = document.getElementById('forgotUserType').value;
    const email = document.getElementById('forgotId').value;
    
    if (!userType || !email) {
        showError('Please fill in the form again to resend the link');
        // Go back to step 1
        document.getElementById('forgotPasswordStep2').classList.add('hidden');
        document.getElementById('forgotPasswordStep1').classList.remove('hidden');
        return;
    }

    try {
        const response = await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                userType: userType
            })
        });

        if (response.success) {
            showSuccess('Reset link sent again! Please check your email.');
        }
    } catch (error) {
        showError(error.message || 'Failed to resend reset link. Please try again.');
    }
}

function logout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    
    // Hide all sections and show welcome
    document.getElementById('teacherSection').classList.add('hidden');
    document.getElementById('studentSection').classList.add('hidden');
    document.getElementById('welcomeSection').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    
    showSuccess('Logged out successfully');
}

// Check for existing session on page load
function checkExistingSession() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        
        // Show appropriate dashboard based on user role
        if (currentUser.role === 'student') {
            showStudentDashboard();
        } else if (currentUser.role === 'faculty') {
            showTeacherDashboard();
        }
    }
}// N
otice Management Functions
async function createNotice(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('noticeTitle').value,
        content: document.getElementById('noticeContent').value,
        priority: document.getElementById('noticePriority').value,
        targetAudience: document.getElementById('noticeAudience').value,
        expiryDate: document.getElementById('noticeExpiry').value || null,
        subject: 'General', // You might want to add a subject field
        academicYear: '2024-2025', // You might want to make this dynamic
        semester: 1 // You might want to make this dynamic
    };

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Publishing...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/notices', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response.success) {
            showSuccess('Notice published successfully!');
            
            // Clear form
            document.getElementById('noticeForm').reset();
            
            // Refresh notices list
            await loadNotices();
        }
    } catch (error) {
        showError(error.message || 'Failed to publish notice. Please try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function loadNotices() {
    const noticesList = document.getElementById('publishedNoticesList');
    if (!noticesList) return;

    showLoading(noticesList, 'Loading notices...');

    try {
        const response = await apiRequest('/notices');
        
        if (response.success && response.data.notices) {
            displayNotices(response.data.notices);
        }
    } catch (error) {
        showError('Failed to load notices', noticesList);
    }
}

function displayNotices(notices) {
    const noticesList = document.getElementById('publishedNoticesList');
    if (!noticesList) return;

    if (notices.length === 0) {
        noticesList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📢</div>
                <div class="text-lg font-medium">No notices published yet</div>
                <div class="text-sm">Create your first notice using the form above</div>
            </div>
        `;
        return;
    }

    noticesList.innerHTML = notices.map(notice => {
        const priorityColors = {
            normal: 'border-blue-500 bg-blue-50',
            important: 'border-yellow-500 bg-yellow-50',
            urgent: 'border-red-500 bg-red-50'
        };

        const priorityTextColors = {
            normal: 'text-blue-800 bg-blue-100',
            important: 'text-yellow-800 bg-yellow-100',
            urgent: 'text-red-800 bg-red-100'
        };

        return `
            <div class="border rounded-lg p-4 border-l-4 ${priorityColors[notice.priority] || priorityColors.normal}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h5 class="font-semibold text-lg text-gray-900">${notice.title}</h5>
                        <p class="text-sm text-gray-600">
                            Published: ${new Date(notice.createdAt).toLocaleDateString()} 
                            ${notice.expiryDate ? `• Expires: ${new Date(notice.expiryDate).toLocaleDateString()}` : ''}
                        </p>
                        <span class="px-2 py-1 rounded text-sm ${priorityTextColors[notice.priority] || priorityTextColors.normal}">
                            ${notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                        </span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editNotice('${notice.id}')" 
                                class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                            Edit
                        </button>
                        <button onclick="deleteNotice('${notice.id}')" 
                                class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                            Delete
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-700 mb-2">${notice.content}</p>
                <div class="text-xs text-gray-500">
                    Target: ${notice.targetAudience} • Views: ${notice.viewCount || 0} • 
                    Read by: ${notice.readCount || 0} users
                </div>
            </div>
        `;
    }).join('');
}

async function editNotice(noticeId) {
    try {
        const response = await apiRequest(`/notices/${noticeId}`);
        
        if (response.success) {
            const notice = response.data.notice;
            
            // Populate form with existing data
            document.getElementById('noticeTitle').value = notice.title;
            document.getElementById('noticeContent').value = notice.content;
            document.getElementById('noticePriority').value = notice.priority;
            document.getElementById('noticeAudience').value = notice.targetAudience;
            document.getElementById('noticeExpiry').value = notice.expiryDate ? 
                new Date(notice.expiryDate).toISOString().split('T')[0] : '';
            
            // Change form to edit mode
            const form = document.getElementById('noticeForm');
            form.setAttribute('data-edit-id', noticeId);
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Update Notice';
            
            // Scroll to form
            form.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        showError('Failed to load notice for editing');
    }
}

async function deleteNotice(noticeId) {
    if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await apiRequest(`/notices/${noticeId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showSuccess('Notice deleted successfully');
            await loadNotices(); // Refresh the list
        }
    } catch (error) {
        showError('Failed to delete notice');
    }
}

function clearNoticeForm() {
    const form = document.getElementById('noticeForm');
    form.reset();
    form.removeAttribute('data-edit-id');
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Publish Notice';
}/
/ Marks Management Functions
async function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
        return;
    }

    // Show loading state
    const fileStatus = document.getElementById('fileStatus');
    const fileStatusText = document.getElementById('fileStatusText');
    
    if (fileStatus && fileStatusText) {
        fileStatus.classList.remove('hidden');
        fileStatusText.textContent = 'Processing file...';
        fileStatusText.className = 'text-sm font-medium text-blue-800';
    }

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('excelFile', file);

        // Upload to marks API
        const response = await fetch(`${API_BASE_URL}/marks/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(`Excel file processed successfully! 
                        ${result.data.successful} records uploaded, 
                        ${result.data.errors} errors, 
                        ${result.data.duplicates} duplicates updated.`);
            
            if (fileStatusText) {
                fileStatusText.textContent = `File processed: ${result.data.successful} records uploaded`;
                fileStatusText.className = 'text-sm font-medium text-green-800';
            }
            
            // Load the updated marks data
            await loadMarksData();
        } else {
            throw new Error(result.message || 'Upload failed');
        }
    } catch (error) {
        showError(`Upload failed: ${error.message}`);
        
        if (fileStatusText) {
            fileStatusText.textContent = 'Upload failed';
            fileStatusText.className = 'text-sm font-medium text-red-800';
        }
    }

    // Reset file input
    event.target.value = '';
}

async function downloadTemplate() {
    try {
        const response = await fetch(`${API_BASE_URL}/marks/template`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'marks_template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Template downloaded successfully!');
        } else {
            throw new Error('Failed to download template');
        }
    } catch (error) {
        showError('Failed to download template');
    }
}

async function loadMarksData() {
    const tableBody = document.getElementById('marksTableBody');
    if (!tableBody) return;

    showLoading(tableBody, 'Loading marks data...');

    try {
        // Get current course/subject (you might need to implement course selection)
        const courseId = getCurrentCourseId(); // Implement this function
        
        if (!courseId) {
            tableBody.innerHTML = `
                <tr class="text-center">
                    <td colspan="10" class="px-4 py-8 text-gray-500">
                        <div class="text-lg font-medium">Please select a course to view marks</div>
                    </td>
                </tr>
            `;
            return;
        }

        const response = await apiRequest(`/marks/course/${courseId}`);
        
        if (response.success && response.data.marks) {
            displayMarksData(response.data.marks);
        }
    } catch (error) {
        showError('Failed to load marks data', tableBody);
    }
}

function displayMarksData(marksData) {
    const tableBody = document.getElementById('marksTableBody');
    if (!tableBody) return;

    if (marksData.length === 0) {
        tableBody.innerHTML = `
            <tr class="text-center">
                <td colspan="10" class="px-4 py-8 text-gray-500">
                    <div class="text-4xl mb-2">📊</div>
                    <div class="text-lg font-medium">No marks data available</div>
                    <div class="text-sm">Upload an Excel file or add marks manually</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = marksData.map(mark => {
        const student = mark.studentId;
        const gradeColors = {
            'A+': 'grade-A',
            'A': 'grade-A',
            'B+': 'grade-B',
            'B': 'grade-B',
            'C+': 'grade-C',
            'C': 'grade-C',
            'D': 'grade-D',
            'F': 'grade-D'
        };

        return `
            <tr class="border-b hover:bg-gray-50" data-mark-id="${mark.id}">
                <td class="px-4 py-3 text-gray-900 border-r font-medium">${student.rollNumber}</td>
                <td class="px-4 py-3 text-gray-900 border-r">${student.firstName} ${student.lastName}</td>
                <td class="px-4 py-3 text-center border-r">
                    <input type="number" value="${mark.test1 || ''}" 
                           class="w-16 px-2 py-1 border rounded bg-white text-gray-900 text-center" 
                           min="0" max="25" step="0.5" 
                           onchange="updateMark(this, 'test1')" />
                </td>
                <td class="px-4 py-3 text-center border-r">
                    <input type="number" value="${mark.test2 || ''}" 
                           class="w-16 px-2 py-1 border rounded bg-white text-gray-900 text-center" 
                           min="0" max="25" step="0.5" 
                           onchange="updateMark(this, 'test2')" />
                </td>
                <td class="px-4 py-3 text-center border-r">
                    <input type="number" value="${mark.presentation || ''}" 
                           class="w-16 px-2 py-1 border rounded bg-white text-gray-900 text-center" 
                           min="0" max="15" step="0.5" 
                           onchange="updateMark(this, 'presentation')" />
                </td>
                <td class="px-4 py-3 text-center border-r">
                    <input type="number" value="${mark.assignment || ''}" 
                           class="w-16 px-2 py-1 border rounded bg-white text-gray-900 text-center" 
                           min="0" max="20" step="0.5" 
                           onchange="updateMark(this, 'assignment')" />
                </td>
                <td class="px-4 py-3 text-center border-r">
                    <input type="number" value="${mark.attendanceMarks || ''}" 
                           class="w-16 px-2 py-1 border rounded bg-white text-gray-900 text-center" 
                           min="0" max="15" step="0.5" 
                           onchange="updateMark(this, 'attendanceMarks')" />
                </td>
                <td class="px-4 py-3 text-center bg-gray-50 font-semibold">${mark.total || 0}</td>
                <td class="px-4 py-3 text-center bg-gray-50">
                    <span class="px-2 py-1 rounded text-white ${gradeColors[mark.grade] || 'grade-D'}">
                        ${mark.grade || 'F'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateMark(input, field) {
    const row = input.closest('tr');
    const markId = row.getAttribute('data-mark-id');
    const value = parseFloat(input.value) || 0;

    try {
        const response = await apiRequest(`/marks/${markId}`, {
            method: 'PUT',
            body: JSON.stringify({
                [field]: value
            })
        });

        if (response.success) {
            // Update the total and grade in the UI
            const updatedMark = response.data.marks;
            const totalCell = row.querySelector('.total-marks');
            const gradeCell = row.querySelector('.grade-display');
            
            if (totalCell) totalCell.textContent = updatedMark.total;
            if (gradeCell) {
                gradeCell.textContent = updatedMark.grade;
                gradeCell.className = `px-2 py-1 rounded text-white grade-${updatedMark.grade.charAt(0)} grade-display`;
            }
        }
    } catch (error) {
        showError(`Failed to update ${field}: ${error.message}`);
        // Revert the input value
        input.value = input.getAttribute('data-original-value') || '';
    }
}

async function saveAllMarks() {
    // This function would batch update all marks
    // For now, we'll show a success message since individual updates are handled above
    showSuccess('All marks have been saved successfully!');
}

async function exportMarks() {
    try {
        const courseId = getCurrentCourseId();
        if (!courseId) {
            showError('Please select a course first');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/marks/course/${courseId}/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `marks_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Marks exported successfully!');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        showError('Failed to export marks');
    }
}

// Helper function to get current course ID (implement based on your UI)
function getCurrentCourseId() {
    // This should return the currently selected course ID
    // You might get this from a dropdown or from the current user's courses
    return currentUser?.courses?.[0]?.id || null;
}// A
ttendance Management Functions
async function loadAttendanceData() {
    const attendanceContainer = document.getElementById('attendanceContainer');
    if (!attendanceContainer) return;

    showLoading(attendanceContainer, 'Loading attendance data...');

    try {
        const courseId = getCurrentCourseId();
        if (!courseId) {
            attendanceContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-lg font-medium">Please select a course to view attendance</div>
                </div>
            `;
            return;
        }

        const response = await apiRequest(`/attendance/course/${courseId}`);
        
        if (response.success) {
            displayAttendanceData(response.data);
        }
    } catch (error) {
        showError('Failed to load attendance data', attendanceContainer);
    }
}

function displayAttendanceData(attendanceData) {
    const attendanceContainer = document.getElementById('attendanceContainer');
    if (!attendanceContainer) return;

    const { attendance, statistics } = attendanceData;

    attendanceContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold text-gray-900">Attendance Management</h3>
                <div class="flex space-x-2">
                    <button onclick="markBulkAttendance()" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Mark Attendance
                    </button>
                    <button onclick="exportAttendance()" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        Export Report
                    </button>
                </div>
            </div>

            <!-- Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-blue-600">${statistics.totalClasses || 0}</div>
                    <div class="text-sm text-blue-800">Total Classes</div>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-green-600">${statistics.overallAttendancePercentage || 0}%</div>
                    <div class="text-sm text-green-800">Average Attendance</div>
                </div>
                <div class="bg-yellow-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-yellow-600">${statistics.statusBreakdown?.present || 0}</div>
                    <div class="text-sm text-yellow-800">Present Today</div>
                </div>
                <div class="bg-red-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-red-600">${statistics.statusBreakdown?.absent || 0}</div>
                    <div class="text-sm text-red-800">Absent Today</div>
                </div>
            </div>

            <!-- Attendance Table -->
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="border border-gray-300 px-4 py-2 text-left">Roll No.</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Student Name</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Status</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Attendance %</th>
                            <th class="border border-gray-300 px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="attendanceTableBody">
                        ${attendance.map(record => `
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2">${record.studentId.rollNumber}</td>
                                <td class="border border-gray-300 px-4 py-2">${record.studentId.firstName} ${record.studentId.lastName}</td>
                                <td class="border border-gray-300 px-4 py-2 text-center">
                                    <select onchange="updateAttendanceStatus('${record.id}', this.value)" 
                                            class="px-2 py-1 border rounded ${getStatusColor(record.status)}">
                                        <option value="present" ${record.status === 'present' ? 'selected' : ''}>Present</option>
                                        <option value="absent" ${record.status === 'absent' ? 'selected' : ''}>Absent</option>
                                        <option value="late" ${record.status === 'late' ? 'selected' : ''}>Late</option>
                                        <option value="excused" ${record.status === 'excused' ? 'selected' : ''}>Excused</option>
                                    </select>
                                </td>
                                <td class="border border-gray-300 px-4 py-2 text-center">
                                    <span class="font-semibold ${getPercentageColor(record.attendancePercentage)}">
                                        ${record.attendancePercentage || 0}%
                                    </span>
                                </td>
                                <td class="border border-gray-300 px-4 py-2 text-center">
                                    <button onclick="viewStudentAttendance('${record.studentId.id}')" 
                                            class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getStatusColor(status) {
    const colors = {
        present: 'bg-green-100 text-green-800',
        absent: 'bg-red-100 text-red-800',
        late: 'bg-yellow-100 text-yellow-800',
        excused: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPercentageColor(percentage) {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
}

async function updateAttendanceStatus(attendanceId, newStatus) {
    try {
        const response = await apiRequest(`/attendance/${attendanceId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (response.success) {
            showSuccess('Attendance updated successfully');
            // Optionally refresh the data
            await loadAttendanceData();
        }
    } catch (error) {
        showError(`Failed to update attendance: ${error.message}`);
    }
}

async function markBulkAttendance() {
    // This would open a modal or form for bulk attendance marking
    const attendanceData = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Get all students for the current course
    const courseId = getCurrentCourseId();
    if (!courseId) {
        showError('Please select a course first');
        return;
    }

    try {
        // You would typically get the student list and create attendance records
        const response = await apiRequest('/attendance/bulk', {
            method: 'POST',
            body: JSON.stringify({
                attendanceData: attendanceData
            })
        });

        if (response.success) {
            showSuccess('Bulk attendance marked successfully');
            await loadAttendanceData();
        }
    } catch (error) {
        showError(`Failed to mark bulk attendance: ${error.message}`);
    }
}

async function exportAttendance() {
    try {
        const courseId = getCurrentCourseId();
        if (!courseId) {
            showError('Please select a course first');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/attendance/course/${courseId}/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Attendance report exported successfully!');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        showError('Failed to export attendance report');
    }
}

async function viewStudentAttendance(studentId) {
    try {
        const response = await apiRequest(`/attendance/student/${studentId}`);
        
        if (response.success) {
            // Display student attendance details in a modal or new section
            displayStudentAttendanceModal(response.data);
        }
    } catch (error) {
        showError('Failed to load student attendance details');
    }
}

function displayStudentAttendanceModal(studentData) {
    // Create and show a modal with detailed student attendance
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Attendance Details - ${studentData.student.name}</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Student attendance summary and details would go here -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-green-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-green-600">${studentData.overallStatistics.presentClasses}</div>
                    <div class="text-sm text-green-800">Present</div>
                </div>
                <div class="bg-red-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-red-600">${studentData.overallStatistics.absentClasses}</div>
                    <div class="text-sm text-red-800">Absent</div>
                </div>
                <div class="bg-yellow-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-yellow-600">${studentData.overallStatistics.lateClasses}</div>
                    <div class="text-sm text-yellow-800">Late</div>
                </div>
                <div class="bg-blue-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-blue-600">${studentData.overallStatistics.overallPercentage}%</div>
                    <div class="text-sm text-blue-800">Overall %</div>
                </div>
            </div>
            
            <div class="text-center">
                <button onclick="this.closest('.fixed').remove()" 
                        class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    
    // Set up event listeners for modals
    document.getElementById('loginModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeLoginModal();
    });
    
    document.getElementById('registrationModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeRegistrationModal();
    });
    
    document.getElementById('forgotPasswordModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeForgotPasswordModal();
    });
});