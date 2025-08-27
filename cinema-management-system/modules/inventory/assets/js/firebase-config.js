// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAg4keZ42SfFHhwjhkYbl7TdJnuN0WsuUc",
    authDomain: "inventory-57376.firebaseapp.com",
    projectId: "inventory-57376",
    storageBucket: "inventory-57376.appspot.com",
    messagingSenderId: "165204980655",
    appId: "1:165204980655:web:f7c5a78a0ae11f7191355a",
    measurementId: "G-E8EK3N3DLE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global Variables
let inventory = [];
let movements = [];
let users = [];
let pickingLists = [];
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        window.location.href = '../../index.html';
        return;
    }
    currentUser = JSON.parse(storedUser);
    document.getElementById('userInfo').textContent = currentUser.fullName;
    
    // Check permissions for tabs
    checkTabPermissions();
}

// Check tab permissions
function checkTabPermissions() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        const tabName = tab.dataset.tab;
        const permissionMap = {
            'inventory': 'view_inventory',
            'movements': 'view_movements',
            'transaction': 'add_transaction',
            'addItem': 'add_item',
            'reports': 'view_reports',
            'pickings': 'view_pickings'
        };
        
        const requiredPermission = permissionMap[tabName];
        if (requiredPermission && !currentUser.permissions.includes(requiredPermission)) {
            tab.style.display = 'none';
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadAllData();
});

// Make inventory search global
window.inventorySearch = '';
window.categoryFilter = '';