// מערכת ניהול הרשאות
console.log('Permissions Manager Loading...');

const PermissionsManager = {
    // המשתמש הנוכחי והרשאותיו
    currentUser: null,
    
    // טעינת משתמש מהזיכרון
    loadCurrentUser: function() {
        console.log('Loading current user...');
        
        // נסה לטעון מ-localStorage
        let userData = localStorage.getItem('currentUser');
        
        // אם לא נמצא, נסה מ-sessionStorage
        if (!userData) {
            userData = sessionStorage.getItem('currentUser');
        }
        
        // אם נמצאו נתונים
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                // הוסף הרשאות לפי התפקיד
                if (!this.currentUser.permissions) {
                    this.currentUser.permissions = this.getRolePermissions(this.currentUser.role);
                }
                console.log('User loaded:', this.currentUser);
            } catch (e) {
                console.error('Error parsing user data:', e);
                // טען משתמש ברירת מחדל
                this.loadDefaultUser();
            }
        } else {
            // טען משתמש ברירת מחדל
            this.loadDefaultUser();
        }
        
        return this.currentUser;
    },
    
    // טעינת משתמש ברירת מחדל
    loadDefaultUser: function() {
        const username = localStorage.getItem('username') || sessionStorage.getItem('username') || 'משתמש';
        const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'admin';
        
        this.currentUser = {
            username: username,
            role: role,
            permissions: this.getRolePermissions(role)
        };
        
        console.log('Default user loaded:', this.currentUser);
    },
    
    // קבלת הרשאות לפי תפקיד
    getRolePermissions: function(role) {
        const rolePermissions = {
            admin: [
                'dashboard_view', 'dashboard_stats', 'dashboard_reports',
                'inventory_view', 'inventory_add', 'inventory_edit', 'inventory_delete',
                'checklist_view', 'checklist_fill', 'checklist_create', 'checklist_approve',
                'reports_view', 'reports_create', 'reports_edit', 'reports_export',
                'staff_view', 'staff_schedule', 'staff_training', 'staff_evaluate',
                'users_view', 'users_manage', 'settings_view', 'settings_manage',
                'monitoring_view', 'alerts_view', 'analytics_view'
            ],
            manager: [
                'dashboard_view', 'dashboard_stats', 'dashboard_reports',
                'inventory_view', 'inventory_add', 'inventory_edit',
                'checklist_view', 'checklist_fill', 'checklist_create', 'checklist_approve',
                'reports_view', 'reports_create', 'reports_edit', 'reports_export',
                'staff_view', 'staff_schedule', 'staff_training',
                'users_view', 'settings_view',
                'monitoring_view', 'alerts_view', 'analytics_view'
            ],
            supervisor: [
                'dashboard_view', 'dashboard_stats',
                'inventory_view', 'inventory_add', 'inventory_edit',
                'checklist_view', 'checklist_fill', 'checklist_approve',
                'reports_view', 'reports_create', 'reports_export',
                'staff_view', 'staff_schedule',
                'users_view',
                'monitoring_view', 'alerts_view'
            ],
            worker: [
                'dashboard_view',
                'inventory_view',
                'checklist_view', 'checklist_fill',
                'reports_view',
                'alerts_view'
            ],
            usher: [
                'dashboard_view',
                'checklist_view', 'checklist_fill',
                'reports_view', 'reports_create',
                'alerts_view'
            ]
        };
        
        return rolePermissions[role] || rolePermissions['worker'];
    },
    
    // בדיקת הרשאה
    hasPermission: function(permission) {
        if (!this.currentUser) {
            this.loadCurrentUser();
        }
        
        if (!this.currentUser || !this.currentUser.permissions) {
            console.warn('No user or permissions found');
            return false;
        }
        
        return this.currentUser.permissions.includes(permission);
    },
    
    // בדיקת הרשאות מרובות
    hasAnyPermission: function(permissions) {
        return permissions.some(p => this.hasPermission(p));
    },
    
    // בדיקת כל ההרשאות
    hasAllPermissions: function(permissions) {
        return permissions.every(p => this.hasPermission(p));
    },
    
    // הסתרת אלמנטים לפי הרשאות
    hideUnauthorizedElements: function() {
        console.log('Hiding unauthorized elements for role:', this.currentUser?.role);
        
        // הסתרת פריטי תפריט
        if (!this.hasPermission('users_view')) {
            const usersMenu = document.getElementById('users-menu-item');
            if (usersMenu) {
                usersMenu.style.display = 'none';
                console.log('Hiding users menu');
            }
        }
        
        if (!this.hasPermission('users_manage')) {
            const permissionsMenu = document.getElementById('permissions-menu-item');
            if (permissionsMenu) {
                permissionsMenu.style.display = 'none';
                console.log('Hiding permissions menu');
            }
        }
        
        // הסתרת כפתורים
        if (!this.hasPermission('reports_export')) {
            const exportBtns = document.querySelectorAll('.action-btn');
            exportBtns.forEach(btn => {
                if (btn.textContent.includes('ייצא')) {
                    btn.style.display = 'none';
                    console.log('Hiding export button');
                }
            });
        }
        
        // הסתרת מודולים במובייל
        this.hideMobileModules();
    },
    
    // הסתרת מודולים במובייל
    hideMobileModules: function() {
        const modulePermissions = {
            'checklists': 'checklist_view',
            'inventory': 'inventory_view',
            'monitoring': 'monitoring_view',
            'reports': 'reports_view',
            'staff': 'staff_view',
            'alerts': 'alerts_view'
        };
        
        Object.keys(modulePermissions).forEach(module => {
            if (!this.hasPermission(modulePermissions[module])) {
                const mobileCards = document.querySelectorAll(`[onclick*="openModule('${module}')"]`);
                mobileCards.forEach(card => {
                    card.style.display = 'none';
                    console.log('Hiding mobile module:', module);
                });
            }
        });
    },
    
    // בדיקת גישה למודול
    checkModuleAccess: function(module) {
        const modulePermissions = {
            'dashboard': 'dashboard_view',
            'users': 'users_view',
            'permissions': 'users_manage',
            'checklists': 'checklist_view',
            'inventory': 'inventory_view',
            'monitoring': 'monitoring_view',
            'reports': 'reports_view',
            'staff': 'staff_view',
            'alerts': 'alerts_view',
            'analytics': 'analytics_view'
        };
        
        const requiredPermission = modulePermissions[module];
        
        if (!requiredPermission) {
            console.log('No permission required for module:', module);
            return true;
        }
        
        if (!this.hasPermission(requiredPermission)) {
            alert('אין לך הרשאה לגשת למודול זה');
            console.log('Access denied to module:', module, 'Missing permission:', requiredPermission);
            return false;
        }
        
        console.log('Access granted to module:', module);
        return true;
    }
};

// הודעה שהמערכת נטענה
console.log('Permissions Manager Loaded Successfully');