// Models Index - Central export file for all database models
// This file provides a convenient way to import all models from a single location

// Import base User model
const User = require('./User');

// Import specialized user models (discriminators)
const Student = require('./Student');
const Faculty = require('./Faculty');
const Admin = require('./Admin');

// Import other models
const Course = require('./Course');
const Assignment = require('./Assignment');
const Notice = require('./Notice');
const Marks = require('./Marks');
const Attendance = require('./Attendance');

/**
 * Model Registry - Object containing all available models
 * This makes it easy to access models dynamically by name
 */
const models = {
    User,
    Student,
    Faculty,
    Admin,
    Course,
    Assignment,
    Notice,
    Marks,
    Attendance
};

/**
 * Get model by name
 * @param {string} modelName - Name of the model to retrieve
 * @returns {mongoose.Model} The requested model
 */
const getModel = (modelName) => {
    const model = models[modelName];
    if (!model) {
        throw new Error(`Model '${modelName}' not found. Available models: ${Object.keys(models).join(', ')}`);
    }
    return model;
};

/**
 * Get all user models (base User and discriminators)
 * @returns {Object} Object containing all user-related models
 */
const getUserModels = () => {
    return {
        User,
        Student,
        Faculty,
        Admin
    };
};

/**
 * Get all academic models (courses, assignments, etc.)
 * @returns {Object} Object containing all academic-related models
 */
const getAcademicModels = () => {
    return {
        Course,
        Assignment,
        Notice,
        Marks,
        Attendance
    };
};

/**
 * Initialize all models
 * This function can be called to ensure all models are properly loaded
 * Useful for testing or when you need to guarantee model availability
 */
const initializeModels = () => {
    console.log('📚 Initializing database models...');
    
    const modelNames = Object.keys(models);
    console.log(`✅ Loaded ${modelNames.length} models: ${modelNames.join(', ')}`);
    
    // Verify discriminator models are properly set up
    const userDiscriminators = User.discriminators;
    if (userDiscriminators) {
        const discriminatorNames = Object.keys(userDiscriminators);
        console.log(`🔗 User discriminators: ${discriminatorNames.join(', ')}`);
    }
    
    return models;
};

/**
 * Get model statistics
 * @returns {Object} Statistics about available models
 */
const getModelStats = () => {
    const userModels = getUserModels();
    const academicModels = getAcademicModels();
    
    return {
        total: Object.keys(models).length,
        userModels: Object.keys(userModels).length,
        academicModels: Object.keys(academicModels).length,
        discriminators: User.discriminators ? Object.keys(User.discriminators).length : 0
    };
};

// Export individual models for direct import
module.exports = {
    // Individual models
    User,
    Student,
    Faculty,
    Admin,
    Course,
    Assignment,
    Notice,
    Marks,
    Attendance,
    
    // Utility functions
    models,
    getModel,
    getUserModels,
    getAcademicModels,
    initializeModels,
    getModelStats
};

// Also provide default export for convenience
module.exports.default = models;