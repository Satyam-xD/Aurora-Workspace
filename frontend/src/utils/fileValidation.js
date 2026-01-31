// File validation utilities

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
];

/**
 * Validates a file for upload
 * @param {File} file - File to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateFile = (file) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
        };
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'File type not allowed. Please upload images, PDFs, or common document formats.'
        };
    }

    return { valid: true, error: null };
};

/**
 * Validates an image file specifically
 * @param {File} file - File to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateImage = (file) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Image size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
        };
    }

    // Check if it's an image
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Please upload a valid image (JPEG, PNG, GIF, or WebP)'
        };
    }

    return { valid: true, error: null };
};

/**
 * Formats file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
