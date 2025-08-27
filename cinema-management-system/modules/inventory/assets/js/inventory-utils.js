// Utility Functions for Inventory Module

// === Loading & UI Functions ===

// Initialization file - ensures all scripts are loaded properly

// Wait for all scripts to load
window.addEventListener('load', function() {
    console.log('Inventory module initialized');
    
    // Check if all required functions are available
    const requiredFunctions = [
        'loadAllData',
        'displayInventory',
        'showLoading',
        'showToast',
        'handleTransactionSubmit',
        'handleAddItemSubmit'
    ];
    
    let allLoaded = true;
    requiredFunctions.forEach(func => {
        if (typeof window[func] !== 'function') {
            console.error(`Required function ${func} is not defined`);
            allLoaded = false;
        }
    });
    
    if (allLoaded) {
        console.log('All required functions loaded successfully');
    } else {
        console.error('Some required functions are missing');
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    if (e.error && e.error.message && e.error.message.includes('is not defined')) {
        showToast('שגיאה בטעינת המערכת. אנא רענן את הדף.', 'error');
    }
});

// Show/Hide loading overlay

function showLoading(show, type = 'general') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('active');
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) {
                const messages = {
                    'general': 'טוען נתונים...',
                    'stats': 'מעדכן סטטיסטיקות...',
                    'inventory': 'טוען מלאי...',
                    'movements': 'טוען תנועות...',
                    'saving': 'שומר נתונים...'
                };
                loadingText.textContent = messages[type] || 'טוען...';
            }
        } else {
            overlay.classList.remove('active');
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // Remove previous classes
    toast.className = 'toast';
    
    // Add type class
    if (type) {
        toast.classList.add(type);
    }
    
    // Set message
    toast.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// === Date Functions ===

// Parse date from various formats
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
        // Try parsing as date object
        if (dateStr instanceof Date) return dateStr;
        
        // Try parsing Firebase timestamp
        if (dateStr.toDate && typeof dateStr.toDate === 'function') {
            return dateStr.toDate();
        }
        
        // Parse string dates
        let parts;
        let day, month, year;
        
        if (dateStr.includes('/')) {
            // Format: DD/MM/YYYY
            parts = dateStr.split('/');
            if (parts.length === 3) {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
                
                // Fix two-digit year
                if (year < 100) {
                    year += 2000;
                }
                
                return new Date(year, month - 1, day);
            }
        } else if (dateStr.includes('.')) {
            // Format: DD.MM.YYYY
            parts = dateStr.split('.');
            if (parts.length === 3) {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
                
                if (year < 100) {
                    year += 2000;
                }
                
                return new Date(year, month - 1, day);
            }
        }
        
        // Try default parsing
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
}

// Format date to DD/MM/YYYY
function formatDate(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : parseDate(date);
    if (!d) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Format date and time
function formatDateTime(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : parseDate(date);
    if (!d) return '';
    
    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${dateStr} ${hours}:${minutes}`;
}

// Get days until date
function getDaysUntil(date) {
    if (!date) return null;
    
    const d = date instanceof Date ? date : parseDate(date);
    if (!d) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    
    const diffTime = d - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// === Unit Functions ===

// Get proper unit name based on quantity
function getUnitName(singular, plural, quantity) {
    if (!singular && !plural) return '';
    
    // For Hebrew, use singular for 1, plural for 0 or more than 1
    if (quantity === 1) {
        return singular || plural || '';
    } else {
        return plural || singular || '';
    }
}

// Populate unit select options
function populateUnitsSelect(selectElement, unitsList) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">בחר יחידה</option>';
    unitsList.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        selectElement.appendChild(option);
    });
}

// === Calculation Functions ===

// Calculate inventory value for an item
function calculateInventoryValue(item) {
    let totalValue = 0;
    
    if (item.variants && Array.isArray(item.variants)) {
        item.variants.forEach(variant => {
            const price = parseFloat(variant.price) || 0;
            const quantity = (variant.packQuantity || 0) + ((variant.unitQuantity || 0) / (item.unitsPerPack || 1));
            totalValue += price * quantity;
        });
    }
    
    return totalValue;
}

// Calculate total inventory value
function calculateTotalInventoryValue() {
    let total = 0;
    inventory.forEach(item => {
        total += calculateInventoryValue(item);
    });
    return total;
}

// === Firebase Functions ===

// Save inventory item
async function saveInventoryItem(item) {
    try {
        await db.collection('inventory').doc(item.name).set(item);
        return true;
    } catch (error) {
        console.error('Error saving item:', error);
        throw error;
    }
}

// Delete inventory item
async function deleteInventoryItem(itemName) {
    try {
        await db.collection('inventory').doc(itemName).delete();
        return true;
    } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
}

// Save movement
async function saveMovement(movement) {
    try {
        // Add timestamp
        movement.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        movement.performer = currentUser ? currentUser.fullName : 'לא ידוע';
        
        await db.collection('movements').add(movement);
        return true;
    } catch (error) {
        console.error('Error saving movement:', error);
        throw error;
    }
}

// === Validation Functions ===

// Validate product form
function validateProductForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim() === '') {
        errors.push('שם המוצר הוא שדה חובה');
    }
    
    if (!formData.category) {
        errors.push('יש לבחור קטגוריה');
    }
    
    if (!formData.baseUnitSingular || !formData.baseUnitPlural) {
        errors.push('יש להגדיר יחידות בסיס');
    }
    
    if (!formData.packUnitSingular || !formData.packUnitPlural) {
        errors.push('יש להגדיר יחידות אריזה');
    }
    
    if (formData.unitsPerPack < 1) {
        errors.push('מספר יחידות באריזה חייב להיות לפחות 1');
    }
    
    return errors;
}

// Validate transaction form
function validateTransactionForm(formData) {
    const errors = [];
    
    if (!formData.type) {
        errors.push('יש לבחור סוג תנועה');
    }
    
    if (!formData.productName) {
        errors.push('יש לבחור מוצר');
    }
    
    if (!formData.packQuantity && !formData.unitQuantity) {
        errors.push('יש להזין כמות');
    }
    
    if (formData.type === 'הכנסה') {
        if (!formData.location || formData.location.trim() === '') {
            errors.push('יש להזין מיקום אחסון');
        }
        
        if (!formData.price || formData.price <= 0) {
            errors.push('יש להזין מחיר');
        }
    }
    
    return errors;
}

// === Export Functions ===

// Export to CSV
function exportToCSV(data, filename) {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}

// Convert data to CSV format
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// === Modal Functions ===

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close any modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// === Helper Functions ===

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format currency
function formatCurrency(amount) {
    return `₪${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Get random ID
function getRandomId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}