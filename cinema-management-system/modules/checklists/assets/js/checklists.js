// checklists.js - ניהול צ'ק ליסטים

// רשימת צ'ק ליסטים זמינים
const CHECKLISTS = {
    opening: {
        id: 'opening',
        name: 'צ\'ק ליסט פתיחה',
        icon: '🌅',
        description: 'בדיקות פתיחת יום',
        items: [
            { id: 1, text: 'בדיקת מערכות תאורה', required: true },
            { id: 2, text: 'בדיקת מערכות מיזוג', required: true },
            { id: 3, text: 'בדיקת מכונות מזון ושתייה', required: true },
            { id: 4, text: 'בדיקת קופות', required: true },
            { id: 5, text: 'בדיקת ניקיון אולמות', required: true },
            { id: 6, text: 'בדיקת מלאי מוצרים', required: true },
            { id: 7, text: 'בדיקת ציוד חירום', required: true },
            { id: 8, text: 'תדרוך צוות בוקר', required: true }
        ]
    },
    closing: {
        id: 'closing',
        name: 'צ\'ק ליסט סגירה',
        icon: '🌙',
        description: 'בדיקות סגירת יום',
        items: [
            { id: 1, text: 'ספירת קופות', required: true },
            { id: 2, text: 'ניקוי אולמות', required: true },
            { id: 3, text: 'כיבוי מכונות מזון', required: true },
            { id: 4, text: 'בדיקת נעילת דלתות', required: true },
            { id: 5, text: 'הפעלת אזעקה', required: true },
            { id: 6, text: 'דיווח תקלות', required: false },
            { id: 7, text: 'גיבוי נתונים', required: true }
        ]
    },
    cleaning: {
        id: 'cleaning',
        name: 'צ\'ק ליסט ניקיון',
        icon: '🧹',
        description: 'בדיקות ניקיון יומיות',
        items: [
            { id: 1, text: 'ניקוי אולמות קולנוע', required: true },
            { id: 2, text: 'ניקוי שירותים', required: true },
            { id: 3, text: 'ניקוי אזור מזנון', required: true },
            { id: 4, text: 'ריקון פחי אשפה', required: true },
            { id: 5, text: 'ניקוי חלונות ודלתות', required: false },
            { id: 6, text: 'חיטוי משטחים', required: true }
        ]
    },
    training: {
        id: 'training',
        name: 'צ\'ק ליסט הכשרה',
        icon: '📚',
        description: 'הכשרת עובד חדש',
        items: [
            { id: 1, text: 'הכרת נהלי עבודה', required: true },
            { id: 2, text: 'הכרת נהלי בטיחות', required: true },
            { id: 3, text: 'הכרת המתחם', required: true },
            { id: 4, text: 'הכרת מערכות', required: true },
            { id: 5, text: 'תרגול מכירה', required: true },
            { id: 6, text: 'חתימה על מסמכים', required: true }
        ]
    }
};

// אתחול הדף
document.addEventListener('DOMContentLoaded', function() {
    initializeChecklistsPage();
});

// פונקציה לאתחול דף צ'ק ליסטים
function initializeChecklistsPage() {
    // בדיקת התחברות
    if (!localStorage.getItem('rememberMe') && !sessionStorage.getItem('isLoggedIn')) {
        window.location.href = '../../login.html';
        return;
    }
    
    // טעינת צ'ק ליסטים
    loadChecklists();
    
    // הגדרת אירועים
    setupEventListeners();
    
    // טעינת היסטוריה
    loadChecklistHistory();
}

// טעינת רשימת צ'ק ליסטים
function loadChecklists() {
    const container = document.getElementById('checklistsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(CHECKLISTS).forEach(checklist => {
        const card = createChecklistCard(checklist);
        container.appendChild(card);
    });
}

// יצירת כרטיס צ'ק ליסט
function createChecklistCard(checklist) {
    const card = document.createElement('div');
    card.className = 'checklist-card';
    card.onclick = () => openChecklist(checklist.id);
    
    const progress = getChecklistProgress(checklist.id);
    const isCompleted = progress === 100;
    
    card.innerHTML = `
        <div class="checklist-icon">${checklist.icon}</div>
        <div class="checklist-info">
            <h3 class="checklist-name">${checklist.name}</h3>
            <p class="checklist-description">${checklist.description}</p>
            <div class="checklist-meta">
                <span class="checklist-items">${checklist.items.length} פריטים</span>
                ${isCompleted ? '<span class="checklist-status completed">✓ הושלם</span>' : ''}
            </div>
        </div>
        <div class="checklist-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
        </div>
    `;
    
    return card;
}

// פתיחת צ'ק ליסט
function openChecklist(checklistId) {
    const checklist = CHECKLISTS[checklistId];
    if (!checklist) return;
    
    // שמירת ה-ID הנוכחי
    sessionStorage.setItem('currentChecklist', checklistId);
    
    // מעבר לדף הצ'ק ליסט
    window.location.href = `checklist-detail.html?id=${checklistId}`;
}

// קבלת התקדמות צ'ק ליסט
function getChecklistProgress(checklistId) {
    const savedData = localStorage.getItem(`checklist_${checklistId}_${getTodayDate()}`);
    if (!savedData) return 0;
    
    const data = JSON.parse(savedData);
    const checklist = CHECKLISTS[checklistId];
    const completed = data.items.filter(item => item.completed).length;
    
    return Math.round((completed / checklist.items.length) * 100);
}

// קבלת תאריך היום
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// הגדרת אירועים
function setupEventListeners() {
    // חיפוש צ'ק ליסטים
    const searchInput = document.getElementById('checklistSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterChecklists(e.target.value);
        });
    }
    
    // סינון לפי סטטוס
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterByStatus(btn.dataset.filter);
        });
    });
}

// סינון צ'ק ליסטים לפי טקסט
function filterChecklists(searchText) {
    const cards = document.querySelectorAll('.checklist-card');
    const search = searchText.toLowerCase();
    
    cards.forEach(card => {
        const name = card.querySelector('.checklist-name').textContent.toLowerCase();
        const description = card.querySelector('.checklist-description').textContent.toLowerCase();
        
        if (name.includes(search) || description.includes(search)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// סינון לפי סטטוס
function filterByStatus(status) {
    const cards = document.querySelectorAll('.checklist-card');
    
    cards.forEach(card => {
        const isCompleted = card.querySelector('.checklist-status.completed');
        
        switch(status) {
            case 'all':
                card.style.display = '';
                break;
            case 'completed':
                card.style.display = isCompleted ? '' : 'none';
                break;
            case 'pending':
                card.style.display = !isCompleted ? '' : 'none';
                break;
        }
    });
}

// טעינת היסטוריית צ'ק ליסטים
function loadChecklistHistory() {
    const historyContainer = document.getElementById('checklistHistory');
    if (!historyContainer) return;
    
    const history = getChecklistHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">אין היסטוריה זמינה</p>';
        return;
    }
    
    const historyHTML = history.map(entry => `
        <div class="history-item">
            <div class="history-icon">${CHECKLISTS[entry.checklistId]?.icon || '📋'}</div>
            <div class="history-info">
                <div class="history-name">${CHECKLISTS[entry.checklistId]?.name || 'צ\'ק ליסט'}</div>
                <div class="history-meta">
                    <span class="history-date">${formatDate(entry.date)}</span>
                    <span class="history-time">${entry.time}</span>
                    <span class="history-user">${entry.user}</span>
                </div>
            </div>
            <div class="history-status ${entry.completed ? 'completed' : 'partial'}">
                ${entry.completed ? '✓ הושלם' : `${entry.progress}%`}
            </div>
        </div>
    `).join('');
    
    historyContainer.innerHTML = historyHTML;
}

// קבלת היסטוריית צ'ק ליסטים
function getChecklistHistory() {
    const history = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
        if (key.startsWith('checklist_') && key.includes('_20')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                const parts = key.split('_');
                const checklistId = parts[1];
                const date = parts[2];
                
                history.push({
                    checklistId,
                    date,
                    time: data.completedAt || data.updatedAt || '',
                    user: data.user || 'משתמש',
                    completed: data.completed || false,
                    progress: data.progress || 0
                });
            } catch (e) {
                console.error('Error parsing history:', e);
            }
        }
    });
    
    // מיון לפי תאריך
    return history.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
}

// פורמט תאריך
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// יצירת צ'ק ליסט חדש
function createNewChecklist() {
    const name = prompt('הזן שם לצ\'ק ליסט החדש:');
    if (!name) return;
    
    const newChecklist = {
        id: 'custom_' + Date.now(),
        name: name,
        icon: '📝',
        description: 'צ\'ק ליסט מותאם אישית',
        items: []
    };
    
    // שמירה ב-localStorage
    const customChecklists = JSON.parse(localStorage.getItem('customChecklists') || '[]');
    customChecklists.push(newChecklist);
    localStorage.setItem('customChecklists', JSON.stringify(customChecklists));
    
    // רענון הרשימה
    loadChecklists();
    
    // פתיחה לעריכה
    openChecklist(newChecklist.id);
}

// ייצוא דוח צ'ק ליסטים
function exportChecklistsReport() {
    const history = getChecklistHistory();
    let csv = 'שם צ\'ק ליסט,תאריך,שעה,משתמש,סטטוס,התקדמות\n';
    
    history.forEach(entry => {
        const name = CHECKLISTS[entry.checklistId]?.name || 'צ\'ק ליסט';
        const status = entry.completed ? 'הושלם' : 'חלקי';
        csv += `"${name}","${entry.date}","${entry.time}","${entry.user}","${status}","${entry.progress}%"\n`;
    });
    
    // הורדת הקובץ
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `checklists_report_${getTodayDate()}.csv`;
    link.click();
}

// עדכון סטטיסטיקות
function updateStatistics() {
    const stats = calculateStatistics();
    
    // עדכון התצוגה
    const elements = {
        todayCompleted: document.getElementById('todayCompleted'),
        weeklyAverage: document.getElementById('weeklyAverage'),
        pendingTasks: document.getElementById('pendingTasks')
    };
    
    if (elements.todayCompleted) {
        elements.todayCompleted.textContent = stats.todayCompleted;
    }
    
    if (elements.weeklyAverage) {
        elements.weeklyAverage.textContent = stats.weeklyAverage + '%';
    }
    
    if (elements.pendingTasks) {
        elements.pendingTasks.textContent = stats.pendingTasks;
    }
}

// חישוב סטטיסטיקות
function calculateStatistics() {
    const today = getTodayDate();
    let todayCompleted = 0;
    let pendingTasks = 0;
    
    Object.keys(CHECKLISTS).forEach(checklistId => {
        const progress = getChecklistProgress(checklistId);
        if (progress === 100) {
            todayCompleted++;
        } else if (progress > 0) {
            pendingTasks++;
        }
    });
    
    return {
        todayCompleted,
        pendingTasks,
        weeklyAverage: 85 // לדוגמה - במציאות יחושב מהנתונים
    };
}

// הפעלת עדכון סטטיסטיקות בטעינה
if (document.getElementById('todayCompleted')) {
    updateStatistics();
}

// רענון אוטומטי כל דקה
setInterval(() => {
    if (document.getElementById('checklistsContainer')) {
        loadChecklists();
        updateStatistics();
    }
}, 60000);