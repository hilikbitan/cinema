// main.js - פונקציות גלובליות לכל המערכת

// קונפיגורציה גלובלית
const APP_CONFIG = {
    name: 'סינמה סיטי חדרה',
    version: '1.0.0',
    apiUrl: '/api', // כתובת ה-API
    updateInterval: 30000, // עדכון כל 30 שניות
    sessionTimeout: 1800000, // 30 דקות
    dateFormat: 'he-IL',
    currency: 'ILS'
};

// אתחול האפליקציה
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// פונקציית אתחול ראשית
function initializeApp() {
    // בדיקת תמיכת דפדפן
    checkBrowserSupport();
    
    // הגדרת handlers גלובליים
    setupGlobalHandlers();
    
    // טעינת הגדרות משתמש
    loadUserSettings();
    
    // אתחול מעקב פעילות
    initActivityTracking();
    
    // הגדרת responsive handlers
    setupResponsiveHandlers();
}

// בדיקת תמיכת דפדפן
function checkBrowserSupport() {
    const requiredFeatures = ['localStorage', 'sessionStorage', 'fetch'];
    const unsupported = [];
    
    requiredFeatures.forEach(feature => {
        if (!(feature in window)) {
            unsupported.push(feature);
        }
    });
    
    if (unsupported.length > 0) {
        alert(`הדפדפן שלך אינו תומך ב: ${unsupported.join(', ')}\nאנא השתמש בדפדפן מודרני.`);
    }
}

// הגדרת handlers גלובליים
function setupGlobalHandlers() {
    // מניעת טעינה כפולה
    preventDoubleSubmit();
    
    // טיפול בשגיאות רשת
    handleNetworkErrors();
    
    // הוספת shortcuts למקלדת
    setupKeyboardShortcuts();
}

// מניעת שליחה כפולה של טפסים
function preventDoubleSubmit() {
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.dataset.submitting) {
            e.preventDefault();
            return;
        }
        form.dataset.submitting = 'true';
        
        setTimeout(() => {
            delete form.dataset.submitting;
        }, 3000);
    });
}

// טיפול בשגיאות רשת
function handleNetworkErrors() {
    window.addEventListener('online', function() {
        showNotification('החיבור לאינטרנט חזר', 'success');
    });
    
    window.addEventListener('offline', function() {
        showNotification('אין חיבור לאינטרנט', 'error');
    });
}

// הגדרת קיצורי מקלדת
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S - שמירה
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCurrentWork();
        }
        
        // Ctrl/Cmd + / - עזרה
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showHelp();
        }
        
        // ESC - סגירת מודלים
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// טעינת הגדרות משתמש
function loadUserSettings() {
    const settings = localStorage.getItem('userSettings');
    if (settings) {
        const parsed = JSON.parse(settings);
        applyUserSettings(parsed);
    }
}

// החלת הגדרות משתמש
function applyUserSettings(settings) {
    if (settings.fontSize) {
        document.documentElement.style.fontSize = settings.fontSize + 'px';
    }
    
    if (settings.highContrast) {
        document.body.classList.add('high-contrast');
    }
    
    if (settings.reducedMotion) {
        document.body.classList.add('reduced-motion');
    }
}

// מעקב פעילות משתמש
function initActivityTracking() {
    let lastActivity = Date.now();
    let warningShown = false;
    
    // אירועי פעילות
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
            warningShown = false;
        });
    });
    
    // בדיקת timeout
    setInterval(() => {
        const inactive = Date.now() - lastActivity;
        
        if (inactive > APP_CONFIG.sessionTimeout - 300000 && !warningShown) {
            // התראה 5 דקות לפני ניתוק
            showNotification('המערכת תנתק בעוד 5 דקות עקב חוסר פעילות', 'warning');
            warningShown = true;
        }
        
        if (inactive > APP_CONFIG.sessionTimeout) {
            // ניתוק אוטומטי
            logout();
        }
    }, 60000); // בדיקה כל דקה
}

// הגדרת handlers לרספונסיביות
function setupResponsiveHandlers() {
    // בדיקת שינוי גודל מסך
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            handleResize();
        }, 250);
    });
    
    // בדיקת שינוי אוריינטציה
    window.addEventListener('orientationchange', () => {
        handleOrientationChange();
    });
}

// טיפול בשינוי גודל מסך
function handleResize() {
    const width = window.innerWidth;
    
    if (width < 768) {
        document.body.classList.add('mobile-view');
        document.body.classList.remove('desktop-view');
    } else {
        document.body.classList.add('desktop-view');
        document.body.classList.remove('mobile-view');
    }
}

// טיפול בשינוי אוריינטציה
function handleOrientationChange() {
    const orientation = window.orientation;
    if (orientation === 90 || orientation === -90) {
        document.body.classList.add('landscape');
        document.body.classList.remove('portrait');
    } else {
        document.body.classList.add('portrait');
        document.body.classList.remove('landscape');
    }
}

// הצגת התראה
function showNotification(message, type = 'info', duration = 3000) {
    // יצירת אלמנט התראה
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // הוספה לדף
    document.body.appendChild(notification);
    
    // אנימציית כניסה
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // הסרה אוטומטית
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// קבלת אייקון להתראה
function getNotificationIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}

// שמירת עבודה נוכחית
function saveCurrentWork() {
    console.log('Saving current work...');
    showNotification('העבודה נשמרה בהצלחה', 'success');
}

// הצגת עזרה
function showHelp() {
    alert('קיצורי מקלדת:\n\nCtrl+S - שמירה\nCtrl+/ - עזרה\nESC - סגירת חלונות');
}

// סגירת כל המודלים
function closeAllModals() {
    document.querySelectorAll('.modal, .popup, .dialog').forEach(modal => {
        modal.classList.remove('show', 'active');
    });
}

// פונקציות API
const API = {
    // GET request
    get: async (endpoint) => {
        try {
            const response = await fetch(`${APP_CONFIG.apiUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    // POST request
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${APP_CONFIG.apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }
};

// קבלת טוקן אימות
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

// פונקציות עזר גלובליות
const Utils = {
    // דיבאונס
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // תרוטל
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // פורמט תאריך
    formatDate: (date, format = 'short') => {
        const options = format === 'short' 
            ? { year: 'numeric', month: '2-digit', day: '2-digit' }
            : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString(APP_CONFIG.dateFormat, options);
    },
    
    // פורמט זמן
    formatTime: (date) => {
        return new Date(date).toLocaleTimeString(APP_CONFIG.dateFormat, {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // פורמט מטבע
    formatCurrency: (amount) => {
        return new Intl.NumberFormat(APP_CONFIG.dateFormat, {
            style: 'currency',
            currency: APP_CONFIG.currency
        }).format(amount);
    }
};

// CSS עבור התראות
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: #333;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    transition: transform 0.3s ease;
    max-width: 90%;
}

.notification.show {
    transform: translateX(-50%) translateY(0);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification-success { background: #4caf50; }
.notification-error { background: #f44336; }
.notification-warning { background: #ff9800; }
.notification-info { background: #2196f3; }

@media (max-width: 768px) {
    .notification {
        left: 10px;
        right: 10px;
        transform: translateY(-100px);
    }
    
    .notification.show {
        transform: translateY(0);
    }
}
</style>
`;

// הוספת סגנונות לדף
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// ייצוא לשימוש גלובלי
window.API = API;
window.Utils = Utils;
window.showNotification = showNotification;