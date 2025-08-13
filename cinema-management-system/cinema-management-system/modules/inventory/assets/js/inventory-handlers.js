// Form Handlers and CRUD Operations

// === Form Handlers ===

// Handle transaction form submission
window.handleTransactionSubmit = async function(e) {
    e.preventDefault();
    
    const transactionType = document.getElementById('transactionType').value;
    if (!transactionType) {
        showToast('יש לבחור סוג תנועה', 'error');
        return;
    }
    
    const rows = document.querySelectorAll('.transaction-row');
    const transactions = [];
    let hasErrors = false;
    
    // Validate and collect all transactions
    for (const row of rows) {
        const productName = row.querySelector('.product-select').value;
        const packQuantity = parseInt(row.querySelector('.pack-quantity').value) || 0;
        const unitQuantity = parseInt(row.querySelector('.unit-quantity').value) || 0;
        const location = row.querySelector('.location')?.value || '';
        const expiry = row.querySelector('.expiry')?.value || '';
        const price = parseFloat(row.querySelector('.price')?.value) || 0;
        const notes = row.querySelector('.notes').value;
        
        if (!productName) {
            showToast('יש לבחור מוצר בכל השורות', 'error');
            hasErrors = true;
            break;
        }
        
        if (packQuantity === 0 && unitQuantity === 0) {
            showToast('יש להזין כמות בכל השורות', 'error');
            hasErrors = true;
            break;
        }
        
        if (transactionType === 'הכנסה' && !location) {
            showToast('יש להזין מיקום לכל ההכנסות', 'error');
            hasErrors = true;
            break;
        }
        
        const item = inventory.find(i => i.name === productName);
        if (!item) continue;
        
        transactions.push({
            type: transactionType,
            productName,
            packQuantity,
            unitQuantity,
            location,
            expiry,
            price,
            notes,
            baseUnitSingular: item.baseUnitSingular,
            baseUnitPlural: item.baseUnitPlural,
            packUnitSingular: item.packUnitSingular,
            packUnitPlural: item.packUnitPlural,
            unitsPerPack: item.unitsPerPack
        });
    }
    
    if (hasErrors || transactions.length === 0) return;
    
    // Process transactions
    showLoading(true, 'saving');
    
    try {
        for (const transaction of transactions) {
            const item = inventory.find(i => i.name === transaction.productName);
            if (!item) continue;
            
            // Update inventory
            if (transaction.type === 'הכנסה') {
                // Add to inventory
                if (!item.variants) item.variants = [];
                
                const existingVariant = item.variants.find(v => 
                    v.location === transaction.location && 
                    v.expiry === transaction.expiry
                );
                
                if (existingVariant) {
                    existingVariant.packQuantity += transaction.packQuantity;
                    existingVariant.unitQuantity += transaction.unitQuantity;
                } else {
                    item.variants.push({
                        location: transaction.location,
                        expiry: transaction.expiry,
                        price: transaction.price,
                        packQuantity: transaction.packQuantity,
                        unitQuantity: transaction.unitQuantity
                    });
                }
            } else {
                // Remove from inventory
                let remainingPacks = transaction.packQuantity;
                let remainingUnits = transaction.unitQuantity;
                
                // Sort variants by expiry date (FIFO)
                if (item.variants) {
                    item.variants.sort((a, b) => {
                        const dateA = parseDate(a.expiry) || new Date(9999, 0, 1);
                        const dateB = parseDate(b.expiry) || new Date(9999, 0, 1);
                        return dateA - dateB;
                    });
                    
                    // Remove from variants
                    for (let i = 0; i < item.variants.length && (remainingPacks > 0 || remainingUnits > 0); i++) {
                        const variant = item.variants[i];
                        
                        if (remainingPacks > 0) {
                            const take = Math.min(remainingPacks, variant.packQuantity);
                            variant.packQuantity -= take;
                            remainingPacks -= take;
                        }
                        
                        if (remainingUnits > 0) {
                            const take = Math.min(remainingUnits, variant.unitQuantity);
                            variant.unitQuantity -= take;
                            remainingUnits -= take;
                        }
                    }
                    
                    // Remove empty variants
                    item.variants = item.variants.filter(v => 
                        v.packQuantity > 0 || v.unitQuantity > 0
                    );
                }
            }
            
            // Update totals
            item.totalPacks = 0;
            item.totalUnits = 0;
            if (item.variants) {
                item.variants.forEach(v => {
                    item.totalPacks += v.packQuantity || 0;
                    item.totalUnits += v.unitQuantity || 0;
                });
            }
            
            // Save to Firebase
            await saveInventoryItem(item);
            await saveMovement(transaction);
        }
        
        // Reload data
        await loadAllData();
        
        showToast(`${transactions.length} תנועות נרשמו בהצלחה`, 'success');
        
        // Reset form
        document.getElementById('multiTransactionForm').reset();
        initTransactionForm();
        
    } catch (error) {
        console.error('Error processing transactions:', error);
        showToast('שגיאה ברישום התנועות', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle add item form submission
window.handleAddItemSubmit = async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('itemName').value.trim(),
        category: document.getElementById('itemCategory').value,
        baseUnitSingular: document.getElementById('baseUnitSingular').value,
        baseUnitPlural: document.getElementById('baseUnitPlural').value,
        packUnitSingular: document.getElementById('packUnitSingular').value,
        packUnitPlural: document.getElementById('packUnitPlural').value,
        unitsPerPack: parseInt(document.getElementById('unitsPerPack').value) || 1,
        minPacks: parseInt(document.getElementById('minPacks').value) || 0
    };
    
    // Validate
    const errors = validateProductForm(formData);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }
    
    // Check if product already exists
    if (inventory.find(i => i.name === formData.name)) {
        showToast('מוצר עם שם זה כבר קיים', 'error');
        return;
    }
    
    showLoading(true, 'saving');
    
    try {
        // Add new item
        const newItem = {
            ...formData,
            variants: [],
            totalPacks: 0,
            totalUnits: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await saveInventoryItem(newItem);
        
        // Reload data
        await loadAllData();
        
        showToast('המוצר נוסף בהצלחה', 'success');
        
        // Reset form
        document.getElementById('addItemForm').reset();
        
    } catch (error) {
        console.error('Error adding item:', error);
        showToast('שגיאה בהוספת המוצר', 'error');
    } finally {
        showLoading(false);
    }
}

// === CRUD Operations ===

// Edit product
window.editProduct = function(productName) {
    const item = inventory.find(i => i.name === productName);
    if (!item) return;
    
    // You can implement a modal here for editing
    // For now, let's use a simple prompt
    const newMinPacks = prompt(`כמות מינימלית למוצר ${productName}:`, item.minPacks || 0);
    
    if (newMinPacks !== null) {
        item.minPacks = parseInt(newMinPacks) || 0;
        
        showLoading(true, 'saving');
        saveInventoryItem(item)
            .then(() => {
                showToast('המוצר עודכן בהצלחה', 'success');
                loadAllData();
            })
            .catch(error => {
                showToast('שגיאה בעדכון המוצר', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }
}

// Delete product
window.deleteProduct = async function(productName) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?\nפעולה זו לא ניתנת לביטול.`)) {
        return;
    }
    
    showLoading(true, 'saving');
    
    try {
        await deleteInventoryItem(productName);
        
        // Remove from local array
        inventory = inventory.filter(i => i.name !== productName);
        
        // Update display
        updateStats();
        displayInventory();
        
        showToast('המוצר נמחק בהצלחה', 'success');
    } catch (error) {
        showToast('שגיאה במחיקת המוצר', 'error');
    } finally {
        showLoading(false);
    }
}

// === Reports Functions ===

// Generate report
window.generateReport = function(reportType) {
    switch (reportType) {
        case 'inventory':
            generateInventoryReport();
            break;
        case 'movements':
            generateMovementsReport();
            break;
        case 'expiring':
            generateExpiringReport();
            break;
        case 'lowstock':
            generateLowStockReport();
            break;
    }
}

// Generate inventory report
function generateInventoryReport() {
    const reportData = inventory.map(item => ({
        'שם מוצר': item.name,
        'קטגוריה': item.category || '-',
        'כמות חבילות': item.totalPacks,
        'כמות יחידות': item.totalUnits,
        'יחידות באריזה': item.unitsPerPack,
        'מלאי מינימלי': item.minPacks || 0,
        'סטטוס': item.totalPacks < (item.minPacks || 0) ? 'מלאי נמוך' : 'תקין'
    }));
    
    const filename = `inventory_report_${formatDate(new Date())}.csv`;
    exportToCSV(reportData, filename);
    showToast('הדוח יורד כעת', 'success');
}

// Generate movements report
function generateMovementsReport() {
    const startDate = prompt('תאריך התחלה (DD/MM/YYYY):');
    const endDate = prompt('תאריך סיום (DD/MM/YYYY):');
    
    if (!startDate || !endDate) return;
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    if (!start || !end) {
        showToast('תאריכים לא תקינים', 'error');
        return;
    }
    
    const filteredMovements = movements.filter(m => {
        const moveDate = m.timestamp ? m.timestamp.toDate() : new Date(m.date);
        return moveDate >= start && moveDate <= end;
    });
    
    const reportData = filteredMovements.map(m => ({
        'תאריך': formatDateTime(m.timestamp ? m.timestamp.toDate() : new Date(m.date)),
        'מוצר': m.productName,
        'סוג': m.type,
        'כמות חבילות': m.packQuantity,
        'כמות יחידות': m.unitQuantity,
        'מבצע': m.performer || '-',
        'הערות': m.notes || '-'
    }));
    
    const filename = `movements_report_${formatDate(start)}_to_${formatDate(end)}.csv`;
    exportToCSV(reportData, filename);
    showToast('הדוח יורד כעת', 'success');
}

// Generate expiring report
function generateExpiringReport() {
    const expiringItems = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    inventory.forEach(item => {
        if (item.variants) {
            item.variants.forEach(variant => {
                if (variant.expiry) {
                    const expiryDate = parseDate(variant.expiry);
                    if (expiryDate && expiryDate <= thirtyDaysFromNow) {
                        const daysUntil = getDaysUntil(expiryDate);
                        expiringItems.push({
                            'מוצר': item.name,
                            'מיקום': variant.location,
                            'תאריך תפוגה': formatDate(expiryDate),
                            'ימים לתפוגה': daysUntil,
                            'כמות חבילות': variant.packQuantity,
                            'כמות יחידות': variant.unitQuantity
                        });
                    }
                }
            });
        }
    });
    
    // Sort by days until expiry
    expiringItems.sort((a, b) => a['ימים לתפוגה'] - b['ימים לתפוגה']);
    
    const filename = `expiring_report_${formatDate(new Date())}.csv`;
    exportToCSV(expiringItems, filename);
    showToast('הדוח יורד כעת', 'success');
}

// Generate low stock report
function generateLowStockReport() {
    const lowStockItems = inventory
        .filter(item => item.totalPacks < (item.minPacks || 0))
        .map(item => ({
            'מוצר': item.name,
            'קטגוריה': item.category || '-',
            'כמות נוכחית': item.totalPacks,
            'מלאי מינימלי': item.minPacks || 0,
            'חוסר': (item.minPacks || 0) - item.totalPacks
        }));
    
    const filename = `low_stock_report_${formatDate(new Date())}.csv`;
    exportToCSV(lowStockItems, filename);
    showToast('הדוח יורד כעת', 'success');
}

// === Picking Functions ===

// Create new picking
window.createNewPicking = function() {
    window.location.href = 'new-picking.html';
}

// View picking
window.viewPicking = function(pickingId) {
    window.open(`pick.html?id=${pickingId}`, '_blank');
}

// Cancel picking
window.cancelPicking = async function(pickingId) {
    if (!confirm('האם אתה בטוח שברצונך לבטל את הליקוט?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        await db.collection('pickingLists').doc(pickingId).update({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            cancelledBy: currentUser ? currentUser.fullName : 'לא ידוע'
        });
        
        await loadPickingLists();
        displayPickings();
        
        showToast('הליקוט בוטל', 'success');
    } catch (error) {
        showToast('שגיאה בביטול הליקוט', 'error');
    } finally {
        showLoading(false);
    }
}