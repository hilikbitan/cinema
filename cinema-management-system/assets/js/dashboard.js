// dashboard.js - לוגיקת הדאשבורד הראשי

// אתחול הדאשבורד
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    updateDateTime();
    loadDashboardData();
});

// פונקציה לאתחול הדאשבורד
function initializeDashboard() {
    // בדיקת מצב התחברות
    checkAuthStatus();
    
    // טעינת העדפות משתמש
    loadUserPreferences();
    
    // הגדרת עדכונים אוטומטיים
    setInterval(updateDashboardData, 30000); // עדכון כל 30 שניות
    setInterval(updateDateTime, 1000); // עדכון שעון כל שנייה
}

// בדיקת סטטוס התחברות
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('rememberMe') || sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
}

// טעינת העדפות משתמש
function loadUserPreferences() {
    const preferences = localStorage.getItem('userPreferences');
    if (preferences) {
        const prefs = JSON.parse(preferences);
        applyTheme(prefs.theme || 'dark');
        setLanguage(prefs.language || 'he');
    }
}

// עדכון תאריך ושעה
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    
    const dateStr = now.toLocaleDateString('he-IL', dateOptions);
    const timeStr = now.toLocaleTimeString('he-IL', timeOptions);
    
    // עדכון בממשק אם יש אלמנטים מתאימים
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    
    if (dateElement) dateElement.textContent = dateStr;
    if (timeElement) timeElement.textContent = timeStr;
}

// טעינת נתוני דאשבורד
function loadDashboardData() {
    // סימולציה של טעינת נתונים - במציאות יבוא מה-API
    const dashboardData = {
        revenue: 47230,
        visitors: 1842,
        activeRooms: 9,
        totalRooms: 12,
        staff: 18,
        plannedStaff: 19,
        satisfaction: 4.7,
        alerts: 2,
        tasks: 7
    };
    
    updateWidgets(dashboardData);
    updateCharts(dashboardData);
}

// עדכון הווידג'טים
function updateWidgets(data) {
    // עדכון ערכים בווידג'טים
    const widgets = {
        revenue: document.querySelector('.widget:nth-child(1) .widget-value'),
        occupancy: document.querySelector('.widget:nth-child(2) .widget-value'),
        staff: document.querySelector('.widget:nth-child(3) .widget-value'),
        satisfaction: document.querySelector('.widget:nth-child(4) .widget-value')
    };
    
    if (widgets.revenue) {
        animateValue(widgets.revenue, data.revenue, '₪');
    }
    
    if (widgets.occupancy) {
        const occupancyPercent = Math.round((data.activeRooms / data.totalRooms) * 100);
        widgets.occupancy.textContent = `${occupancyPercent}%`;
    }
    
    if (widgets.staff) {
        widgets.staff.textContent = data.staff;
    }
    
    if (widgets.satisfaction) {
        widgets.satisfaction.textContent = data.satisfaction;
    }
    
    // עדכון באדג'ים
    updateBadges(data);
}

// עדכון באדג'ים
function updateBadges(data) {
    const badges = document.querySelectorAll('.nav-badge');
    badges.forEach(badge => {
        const parent = badge.parentElement;
        if (parent.textContent.includes('התראות')) {
            badge.textContent = data.alerts;
        } else if (parent.textContent.includes('צ\'ק ליסטים')) {
            badge.textContent = data.tasks;
        }
    });
}

// אנימציה לערכים מספריים
function animateValue(element, value, prefix = '') {
    const current = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
    const increment = (value - current) / 20;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        const newValue = Math.round(current + (increment * step));
        element.textContent = `${prefix}${newValue.toLocaleString('he-IL')}`;
        
        if (step >= 20) {
            clearInterval(timer);
            element.textContent = `${prefix}${value.toLocaleString('he-IL')}`;
        }
    }, 50);
}

// עדכון נתוני דאשבורד
function updateDashboardData() {
    // סימולציה של עדכון נתונים בזמן אמת
    const widgets = document.querySelectorAll('.widget-value');
    
    widgets.forEach(widget => {
        if (widget.textContent.includes('₪')) {
            const current = parseInt(widget.textContent.replace(/[^\d]/g, ''));
            const change = Math.floor(Math.random() * 1000) - 500;
            const newValue = Math.max(0, current + change);
            widget.textContent = `₪${newValue.toLocaleString('he-IL')}`;
            
            // עדכון טרנד
            updateTrend(widget.closest('.widget'), change);
        }
    });
}

// עדכון אינדיקטור מגמה
function updateTrend(widget, change) {
    const trendElement = widget.querySelector('.widget-trend');
    if (trendElement) {
        if (change > 0) {
            trendElement.textContent = `+${Math.abs(change)}`;
            trendElement.className = 'widget-trend trend-up';
        } else if (change < 0) {
            trendElement.textContent = `-${Math.abs(change)}`;
            trendElement.className = 'widget-trend trend-down';
        }
    }
}

// עדכון גרפים (placeholder)
function updateCharts(data) {
    // כאן ניתן להוסיף לוגיקה לעדכון גרפים עם Chart.js או ספרייה אחרת
    console.log('Updating charts with data:', data);
}

// החלפת תמה
function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('selectedTheme', theme);
}

// הגדרת שפה
function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

// ייצוא דוח
function exportReport() {
    const reportData = collectReportData();
    downloadReport(reportData);
}

// איסוף נתונים לדוח
function collectReportData() {
    const widgets = document.querySelectorAll('.widget');
    const data = {
        date: new Date().toLocaleDateString('he-IL'),
        time: new Date().toLocaleTimeString('he-IL'),
        metrics: []
    };
    
    widgets.forEach(widget => {
        const title = widget.querySelector('.widget-title').textContent;
        const value = widget.querySelector('.widget-value').textContent;
        data.metrics.push({ title, value });
    });
    
    return data;
}

// הורדת דוח
function downloadReport(data) {
    const content = generateReportContent(data);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_report_${data.date.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// יצירת תוכן הדוח
function generateReportContent(data) {
    let content = 'דוח דאשבורד - סינמה סיטי חדרה\n';
    content += `תאריך: ${data.date}\n`;
    content += `שעה: ${data.time}\n\n`;
    content += 'מדד,ערך\n';
    
    data.metrics.forEach(metric => {
        content += `"${metric.title}","${metric.value}"\n`;
    });
    
    return content;
}

// טיפול בשגיאות
window.addEventListener('error', function(e) {
    console.error('Dashboard Error:', e);
    // כאן ניתן להוסיף לוגיקה לשליחת שגיאות לשרת
});

// ניקוי משאבים לפני יציאה
window.addEventListener('beforeunload', function() {
    // שמירת מצב לפני יציאה
    saveSessionState();
});

// שמירת מצב הסשן
function saveSessionState() {
    const state = {
        lastUpdate: new Date().toISOString(),
        activeModule: document.getElementById('pageTitle').textContent
    };
    sessionStorage.setItem('dashboardState', JSON.stringify(state));
}

// טעינת מצב קודם
function loadSessionState() {
    const state = sessionStorage.getItem('dashboardState');
    if (state) {
        const parsed = JSON.parse(state);
        console.log('Previous session state:', parsed);
        // כאן ניתן לשחזר מצב קודם
    }
}

// פונקציות עזר נוספות
const DashboardHelpers = {
    // פורמט מספרים
    formatNumber: (num) => {
        return new Intl.NumberFormat('he-IL').format(num);
    },
    
    // פורמט מטבע
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    },
    
    // חישוב אחוזים
    calculatePercentage: (value, total) => {
        return Math.round((value / total) * 100);
    },
    
    // זמן יחסי
    getRelativeTime: (date) => {
        const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });
        const daysDiff = Math.round((date - new Date()) / (1000 * 60 * 60 * 24));
        return rtf.format(daysDiff, 'day');
    }
};

// ייצוא פונקציות לשימוש גלובלי
window.DashboardHelpers = DashboardHelpers;