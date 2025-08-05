// Utility functions placeholder
function formatCurrency(amount) {
  return `₪${Number(amount).toLocaleString('he-IL')}`;
}

// Expose globally if needed
window.formatCurrency = formatCurrency;
