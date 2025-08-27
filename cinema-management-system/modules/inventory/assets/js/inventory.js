// Main Inventory Module JavaScript

// Units Lists
let baseUnitsSingularList = ['יחידה', 'גרם', 'ק"ג', 'ליטר', 'מ"ל'];
let baseUnitsPluralList = ['יחידות', 'גרם', 'ק"ג', 'ליטר', 'מ"ל'];
let packUnitsSingularList = ['חבילה', 'קופסה', 'שקית', 'בקבוק', 'מארז'];
let packUnitsPluralList = ['חבילות', 'קופסאות', 'שקיות', 'בקבוקים', 'מארזים'];

// Inventory Search and Filter
let inventorySearch = '';
let categoryFilter = '';
let inventorySort = { by: '', dir: 1 };

// === Main Functions ===

// Load all data from Firebase
async function loadAllData() {
    showLoading(true);
    try {
        // Load inventory
        await loadInventory();
        
        // Load movements
        await loadMovements();
        
        // Load picking lists
        await loadPickingLists();
        
        // Update stats
        updateStats();
        
        // Display current tab
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const tabName = activeTab.dataset.tab;
            displayTab(tabName);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
        showLoading(false);
    }
}

// Load inventory from Firebase
async function loadInventory() {
    inventory = [];
    const snapshot = await db.collection('inventory').get();
    snapshot.forEach(doc => {
        const item = doc.data();
        // Calculate total packs and units
        item.totalPacks = 0;
        item.totalUnits = 0;
        if (item.variants && Array.isArray(item.variants)) {
            item.variants.forEach(v => {
                item.totalPacks += (v.packQuantity || 0);
                item.totalUnits += (v.unitQuantity || 0);
            });
        }
        inventory.push(item);
    });
}

// Load movements from Firebase
async function loadMovements() {
    movements = [];
    const snapshot = await db.collection('movements')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
    snapshot.forEach(doc => {
        movements.push(doc.data());
    });
}

// Load picking lists from Firebase
async function loadPickingLists() {
    pickingLists = [];
    const snapshot = await db.collection('pickingLists')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    snapshot.forEach(doc => {
        pickingLists.push({ id: doc.id, ...doc.data() });
    });
}

// Update statistics
function updateStats() {
    // Total products
    document.getElementById('totalProducts').textContent = inventory.length;
    
    // Low stock count
    const lowStock = inventory.filter(item => {
        return item.totalPacks < (item.minPacks || 0);
    }).length;
    document.getElementById('lowStockCount').textContent = lowStock;
    
    // Expiring count
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    let expiringCount = 0;
    inventory.forEach(item => {
        if (item.variants) {
            item.variants.forEach(v => {
                if (v.expiry) {
                    const expiryDate = parseDate(v.expiry);
                    if (expiryDate && expiryDate <= thirtyDaysFromNow) {
                        expiringCount++;
                    }
                }
            });
        }
    });
    document.getElementById('expiringCount').textContent = expiringCount;
    
    // Today's movements
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMovements = movements.filter(m => {
        const moveDate = m.timestamp ? m.timestamp.toDate() : new Date(m.date);
        return moveDate >= todayStart;
    }).length;
    document.getElementById('todayMovements').textContent = todayMovements;
}

// === Tab Management ===

function showTab(event, tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (event.target) {
        event.target.classList.add('active');
    } else {
        document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    
    // Display tab content
    displayTab(tabName);
}

function displayTab(tabName) {
    switch (tabName) {
        case 'inventory':
            displayInventory();
            break;
        case 'movements':
            displayMovements();
            break;
        case 'transaction':
            initTransactionForm();
            break;
        case 'addItem':
            initAddItemForm();
            break;
        case 'reports':
            // Reports are handled by click events
            break;
        case 'pickings':
            displayPickings();
            break;
    }
}

// === Display Functions ===

// Display inventory table
function displayInventory() {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    
    // Filter and sort inventory
    let filteredInventory = inventory.filter(item => {
        const matchesSearch = !inventorySearch || 
            item.name.toLowerCase().includes(inventorySearch.toLowerCase());
        const matchesCategory = !categoryFilter || 
            item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // Sort if needed
    if (inventorySort.by) {
        filteredInventory.sort((a, b) => {
            let aVal = a[inventorySort.by];
            let bVal = b[inventorySort.by];
            
            if (typeof aVal === 'string') {
                return inventorySort.dir * aVal.localeCompare(bVal);
            }
            return inventorySort.dir * (aVal - bVal);
        });
    }
    
    // Build table HTML
    let html = '';
    filteredInventory.forEach(item => {
        const isLowStock = item.totalPacks < (item.minPacks || 0);
        const rowClass = isLowStock ? 'low-stock' : '';
        
        html += `
            <tr class="${rowClass}">
                <td>${item.name}</td>
                <td>${item.category || '-'}</td>
                <td>
                    ${item.totalPacks} ${getUnitName(item.packUnitSingular, item.packUnitPlural, item.totalPacks)}
                    ${item.totalUnits > 0 ? `<br><small>${item.totalUnits} ${getUnitName(item.baseUnitSingular, item.baseUnitPlural, item.totalUnits)}</small>` : ''}
                </td>
                <td>₪${calculateInventoryValue(item).toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn-small btn-edit" onclick="editProduct('${item.name}')">עריכה</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${item.name}')">מחיקה</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;">אין מוצרים להצגה</td></tr>';
}

// Display movements table
function displayMovements() {
    const tbody = document.getElementById('movementsBody');
    if (!tbody) return;
    
    // Filter movements if needed
    const dateFilter = document.getElementById('movementsDateFilter').value;
    const typeFilter = document.getElementById('movementsTypeFilter').value;
    
    let filteredMovements = movements.filter(m => {
        const matchesType = !typeFilter || m.type === typeFilter;
        
        if (dateFilter) {
            const moveDate = m.timestamp ? m.timestamp.toDate() : new Date(m.date);
            const filterDate = new Date(dateFilter);
            return matchesType && 
                moveDate.toDateString() === filterDate.toDateString();
        }
        
        return matchesType;
    });
    
    // Build table HTML
    let html = '';
    filteredMovements.forEach(movement => {
        const date = movement.timestamp ? 
            movement.timestamp.toDate() : 
            new Date(movement.date);
        
        html += `
            <tr>
                <td>${formatDateTime(date)}</td>
                <td>${movement.productName}</td>
                <td class="${movement.type === 'הכנסה' ? 'text-success' : 'text-danger'}">
                    ${movement.type}
                </td>
                <td>
                    ${movement.packQuantity} ${getUnitName(movement.packUnitSingular, movement.packUnitPlural, movement.packQuantity)}
                    ${movement.unitQuantity > 0 ? `<br><small>${movement.unitQuantity} ${getUnitName(movement.baseUnitSingular, movement.baseUnitPlural, movement.unitQuantity)}</small>` : ''}
                </td>
                <td>${movement.performer || '-'}</td>
                <td>${movement.notes || '-'}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;">אין תנועות להצגה</td></tr>';
}

// Display pickings table
function displayPickings() {
    const tbody = document.getElementById('pickingsBody');
    if (!tbody) return;
    
    let html = '';
    pickingLists.forEach(picking => {
        const statusClass = picking.status === 'done' ? 'text-success' : 
                          picking.status === 'pending' ? 'text-warning' : '';
        const statusText = picking.status === 'done' ? 'הושלם' : 
                          picking.status === 'pending' ? 'ממתין' : 'בוטל';
        
        html += `
            <tr>
                <td>${formatDate(picking.createdAt.toDate())}</td>
                <td>${picking.name}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>${picking.pickedBy || '-'}</td>
                <td class="action-buttons">
                    <button class="btn-small btn-primary" onclick="viewPicking('${picking.id}')">
                        הצג
                    </button>
                    ${picking.status === 'pending' ? 
                        `<button class="btn-small btn-danger" onclick="cancelPicking('${picking.id}')">
                            ביטול
                        </button>` : ''
                    }
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;">אין ליקוטים להצגה</td></tr>';
}

// === Form Functions ===

// Initialize transaction form
function initTransactionForm() {
    const container = document.getElementById('multiTransactionRows');
    if (!container) return;
    
    container.innerHTML = '';
    addTransactionRow();
}

// Add transaction row
function addTransactionRow() {
    const container = document.getElementById('multiTransactionRows');
    if (!container) return;
    
    const rowIndex = container.children.length;
    const rowHtml = `
        <div class="transaction-row" data-index="${rowIndex}">
            <div class="transaction-row-header">
                <span class="row-number">שורה ${rowIndex + 1}</span>
                ${rowIndex > 0 ? '<button type="button" class="remove-row-btn" onclick="removeTransactionRow(this)">הסר</button>' : ''}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>מוצר:</label>
                    <select class="form-select product-select" required onchange="updateProductUnits(this)">
                        <option value="">בחר מוצר</option>
                        ${inventory.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>כמות חבילות:</label>
                    <input type="number" class="form-input pack-quantity" min="0" value="0">
                    <small class="pack-unit-display"></small>
                </div>
                <div class="form-group">
                    <label>כמות יחידות:</label>
                    <input type="number" class="form-input unit-quantity" min="0" value="0">
                    <small class="unit-display"></small>
                </div>
            </div>
            <div class="form-row transaction-type-specific" style="display:none;">
                <div class="form-group">
                    <label>מיקום:</label>
                    <input type="text" class="form-input location">
                </div>
                <div class="form-group">
                    <label>תאריך תפוגה:</label>
                    <input type="date" class="form-input expiry">
                </div>
                <div class="form-group">
                    <label>מחיר:</label>
                    <input type="number" class="form-input price" min="0" step="0.01">
                </div>
            </div>
            <div class="form-group">
                <label>הערות:</label>
                <input type="text" class="form-input notes">
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHtml);
    
    // Show/hide fields based on transaction type
    const transactionType = document.getElementById('transactionType').value;
    if (transactionType === 'הכנסה') {
        container.lastElementChild.querySelector('.transaction-type-specific').style.display = 'grid';
    }
}

// Remove transaction row
function removeTransactionRow(button) {
    button.closest('.transaction-row').remove();
    updateRowNumbers();
}

// Update row numbers
function updateRowNumbers() {
    const rows = document.querySelectorAll('.transaction-row');
    rows.forEach((row, index) => {
        row.querySelector('.row-number').textContent = `שורה ${index + 1}`;
    });
}

// Update product units display
function updateProductUnits(select) {
    const row = select.closest('.transaction-row');
    const productName = select.value;
    const item = inventory.find(i => i.name === productName);
    
    if (item) {
        row.querySelector('.pack-unit-display').textContent = item.packUnitPlural || '';
        row.querySelector('.unit-display').textContent = item.baseUnitPlural || '';
    }
}

// Initialize add item form
function initAddItemForm() {
    // Populate unit selects
    populateUnitsSelect(document.getElementById('baseUnitSingular'), baseUnitsSingularList);
    populateUnitsSelect(document.getElementById('baseUnitPlural'), baseUnitsPluralList);
    populateUnitsSelect(document.getElementById('packUnitSingular'), packUnitsSingularList);
    populateUnitsSelect(document.getElementById('packUnitPlural'), packUnitsPluralList);
}

// === Event Listeners ===

// Initialize event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Search and filter listeners
    const inventorySearch = document.getElementById('inventorySearch');
    if (inventorySearch) {
        inventorySearch.addEventListener('input', function(e) {
            window.inventorySearch = e.target.value;
            displayInventory();
        });
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function(e) {
            window.categoryFilter = e.target.value;
            displayInventory();
        });
    }

    // Transaction type change
    const transactionType = document.getElementById('transactionType');
    if (transactionType) {
        transactionType.addEventListener('change', function(e) {
            const rows = document.querySelectorAll('.transaction-type-specific');
            rows.forEach(row => {
                row.style.display = e.target.value === 'הכנסה' ? 'grid' : 'none';
            });
        });
    }

    // Form submissions
    const multiTransactionForm = document.getElementById('multiTransactionForm');
    if (multiTransactionForm) {
        multiTransactionForm.addEventListener('submit', window.handleTransactionSubmit);
    }

    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', window.handleAddItemSubmit);
    }
});

// Sort inventory
function sortInventory(field) {
    if (inventorySort.by === field) {
        inventorySort.dir *= -1;
    } else {
        inventorySort.by = field;
        inventorySort.dir = 1;
    }
    displayInventory();
}