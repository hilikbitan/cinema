// פונקציות כלליות לכל האפליקציה

// ניווט בין דפים
function navigateTo(path) {
    window.location.href = path;
}

// חזרה לדף הבית
function goHome() {
    navigateTo('/');
}

// שמירת נתונים ל-localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// קריאת נתונים מ-localStorage
function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// פורמט תאריך בעברית
function formatDate(date) {
    return new Date(date).toLocaleDateString('he-IL');
}

// הצגת התראות
function showAlert(message, type = 'info') {
    alert(message); // בעתיד נחליף במערכת התראות מתקדמת
}