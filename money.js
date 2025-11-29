// App state
let transactions = [];
let currentFilter = 'all';
let settings = {
    theme: 'light',
    currency: 'USD',
    profileName: '',
    profileImage: ''
};

// Currency symbols
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': '$',
    'CAD': '$'
};

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const balanceElement = document.getElementById('balance');
const incomeElement = document.getElementById('income');
const expensesElement = document.getElementById('expenses');
const transactionList = document.getElementById('transaction-list');
const filterButtons = document.querySelectorAll('.filter-btn');

// Navigation
const navButtons = document.querySelectorAll('.nav-btn[data-page]');
const pages = document.querySelectorAll('.page');

// Modal
const modal = document.getElementById('transaction-modal');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const closeModalBtn = document.getElementById('close-modal');

// Settings
const themeButtons = document.querySelectorAll('.theme-btn');
const currencySelect = document.getElementById('currency-select');

// Profile
const profileNameInput = document.getElementById('profile-name');
const profileImageInput = document.getElementById('profile-image-input');
const profileImage = document.getElementById('profile-image');
const navAvatar = document.getElementById('nav-avatar');

// Greeting and Date
const greetingElement = document.getElementById('greeting');
const currentDateElement = document.getElementById('current-date');

// Initialize app
function init() {
    loadSettings();
    loadTransactions();
    applyTheme();
    updateGreeting();
    updateCurrentDate();
    loadProfile();
    updateDisplay();
    attachEventListeners();

    // Update greeting and date every minute
    setInterval(updateGreeting, 60000);
    setInterval(updateCurrentDate, 60000);
}

// Event Listeners
function attachEventListeners() {
    transactionForm.addEventListener('submit', handleAddTransaction);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            navigateToPage(page);
        });
    });

    addTransactionBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
        });
    });

    currencySelect.addEventListener('change', (e) => {
        setCurrency(e.target.value);
    });

    // Profile
    if (profileNameInput) {
        profileNameInput.addEventListener('blur', () => {
            settings.profileName = profileNameInput.value.trim();
            saveSettings();
        });

        profileNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                profileNameInput.blur();
            }
        });
    }

    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageUpload);
    }
}

// Navigation
function navigateToPage(pageName) {
    pages.forEach(page => {
        if (page.classList.contains(`${pageName}-page`)) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    navButtons.forEach(btn => {
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Modal functions
function openModal() {
    modal.classList.add('active');
    descriptionInput.focus();
}

function closeModal() {
    modal.classList.remove('active');
}

// Settings functions
function setTheme(theme) {
    settings.theme = theme;
    saveSettings();
    applyTheme();

    themeButtons.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function applyTheme() {
    if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

function setCurrency(currency) {
    settings.currency = currency;
    saveSettings();
    updateDisplay();
}

function loadSettings() {
    const stored = localStorage.getItem('moneyTrackerSettings');
    if (stored) {
        settings = JSON.parse(stored);
        currencySelect.value = settings.currency;
    }
}

function saveSettings() {
    localStorage.setItem('moneyTrackerSettings', JSON.stringify(settings));
}

// Load transactions from localStorage
function loadTransactions() {
    const stored = localStorage.getItem('moneyTrackerTransactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('moneyTrackerTransactions', JSON.stringify(transactions));
}

// Add new transaction
function handleAddTransaction(e) {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = document.querySelector('input[name="type"]:checked').value;

    if (!description || !amount || amount <= 0) {
        alert('Please enter valid description and amount');
        return;
    }

    const transaction = {
        id: generateId(),
        description,
        amount,
        type,
        date: new Date().toISOString()
    };

    transactions.unshift(transaction);
    saveTransactions();
    updateDisplay();

    transactionForm.reset();
    closeModal();
    navigateToPage('home');
    showNotification('Transaction added successfully!');
}

// Delete transaction
function deleteTransaction(id) {
    const deletedTransaction = transactions.find(t => t.id === id);
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDisplay();
    showDeleteToast(deletedTransaction);
}

// Handle filter
function handleFilter(e) {
    currentFilter = e.target.dataset.filter;
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    updateDisplay();
}

// Update all displays
function updateDisplay() {
    updateBalance();
    updateTransactionList();
    updateReports();
    updateCharts();
}

// Update balance and summary
function updateBalance() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    balanceElement.textContent = formatCurrency(balance);
    incomeElement.textContent = formatCurrency(income);
    expensesElement.textContent = formatCurrency(expenses);

    if (balance < 0) {
        balanceElement.style.color = 'var(--expense)';
    } else {
        balanceElement.style.color = 'var(--primary-green)';
    }
}

// Update transaction list
function updateTransactionList() {
    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        const emptyMessage = currentFilter === 'all'
            ? 'No transactions yet. Click the + button below to add your first transaction!'
            : `No ${currentFilter} transactions found.`;

        transactionList.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
    }

    transactionList.innerHTML = filteredTransactions
        .map(transaction => createTransactionHTML(transaction))
        .join('');

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(e.currentTarget.dataset.id);
            deleteTransaction(id);
        });
    });
}

// Get filtered transactions
function getFilteredTransactions() {
    if (currentFilter === 'all') {
        return transactions;
    }
    return transactions.filter(t => t.type === currentFilter);
}

// Create transaction HTML
function createTransactionHTML(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-';
    const dateFormatted = formatDate(transaction.date);

    return `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${dateFormatted}</div>
            </div>
            <span class="transaction-amount">${sign}${formatCurrency(transaction.amount)}</span>
            <button class="btn-delete" data-id="${transaction.id}">Delete</button>
        </div>
    `;
}

// Update reports
function updateReports() {
    const totalTrans = document.getElementById('total-transactions');
    const avgIncome = document.getElementById('avg-income');
    const avgExpense = document.getElementById('avg-expense');
    const highest = document.getElementById('highest-transaction');
    const monthTotal = document.getElementById('month-total');
    const balanceTrend = document.getElementById('balance-trend');

    if (!totalTrans) return;

    totalTrans.textContent = transactions.length;

    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const avgIncomeVal = incomeTransactions.length > 0
        ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length
        : 0;
    avgIncome.textContent = formatCurrency(avgIncomeVal);

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const avgExpenseVal = expenseTransactions.length > 0
        ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length
        : 0;
    avgExpense.textContent = formatCurrency(avgExpenseVal);

    const highestAmount = transactions.length > 0
        ? Math.max(...transactions.map(t => t.amount))
        : 0;
    highest.textContent = formatCurrency(highestAmount);

    const now = new Date();
    const monthTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getMonth() === now.getMonth() &&
            transDate.getFullYear() === now.getFullYear();
    });
    const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    monthTotal.textContent = formatCurrency(monthIncome - monthExpense);

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    if (balance > 0) {
        balanceTrend.textContent = 'Positive ✅';
        balanceTrend.style.color = 'var(--income)';
    } else if (balance < 0) {
        balanceTrend.textContent = 'Negative ⚠️';
        balanceTrend.style.color = 'var(--expense)';
    } else {
        balanceTrend.textContent = 'Neutral ➖';
        balanceTrend.style.color = 'var(--text-light)';
    }
}

// Update charts
function updateCharts() {
    const incomeExpenseChart = document.getElementById('income-expense-chart');
    const recentChart = document.getElementById('recent-chart');

    if (!incomeExpenseChart) return;

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const maxAmount = Math.max(totalIncome, totalExpense, 1);
    const incomeHeight = (totalIncome / maxAmount) * 100;
    const expenseHeight = (totalExpense / maxAmount) * 100;

    incomeExpenseChart.innerHTML = `
        <div class="bar" style="height: ${incomeHeight}%">
            <span class="bar-value">${formatCurrency(totalIncome)}</span>
            <span class="bar-label">Income</span>
        </div>
        <div class="bar expense" style="height: ${expenseHeight}%">
            <span class="bar-value">${formatCurrency(totalExpense)}</span>
            <span class="bar-label">Expenses</span>
        </div>
    `;

    const recentTransactions = transactions.slice(0, 5);

    if (recentTransactions.length === 0) {
        recentChart.innerHTML = '<p class="empty-state">No transactions yet</p>';
        return;
    }

    const maxRecentAmount = Math.max(...recentTransactions.map(t => t.amount));

    recentChart.innerHTML = recentTransactions.map(t => {
        const widthPercent = (t.amount / maxRecentAmount) * 100;
        return `
            <div class="chart-item">
                <span class="chart-item-label">${escapeHtml(t.description)}</span>
                <div class="chart-item-bar">
                    <div class="chart-item-fill ${t.type}" style="width: ${widthPercent}%">
                        ${formatCurrency(t.amount)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Utility: Format currency
function formatCurrency(amount) {
    const symbol = currencySymbols[settings.currency] || '$';
    return symbol + Math.abs(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Utility: Generate unique ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 110px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--primary-green);
        color: white;
        padding: 14px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        font-weight: 500;
        animation: slideUp 0.3s ease forwards;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Utility: Show delete toast with undo option
function showDeleteToast(deletedTransaction) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 110px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--text-dark);
        color: white;
        padding: 14px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 16px;
        animation: slideUp 0.3s ease forwards;
    `;

    const message = document.createElement('span');
    message.textContent = 'Transaction deleted';
    message.style.cssText = 'flex: 1;';

    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'UNDO';
    undoBtn.style.cssText = `
        background: transparent;
        border: none;
        color: var(--primary-green);
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 0.9rem;
    `;

    undoBtn.addEventListener('click', () => {
        transactions.unshift(deletedTransaction);
        saveTransactions();
        updateDisplay();
        toast.remove();
        showNotification('Transaction restored');
    });

    toast.appendChild(message);
    toast.appendChild(undoBtn);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Profile functions
function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const imageData = event.target.result;
        settings.profileImage = imageData;
        saveSettings();
        displayProfileImage(imageData);
    };
    reader.readAsDataURL(file);
}

function displayProfileImage(imageData) {
    if (imageData && profileImage) {
        profileImage.src = imageData;
        profileImage.style.display = 'block';
    }

    if (imageData && navAvatar) {
        navAvatar.src = imageData;
        navAvatar.style.display = 'block';
    }
}

function loadProfile() {
    if (settings.profileName && profileNameInput) {
        profileNameInput.value = settings.profileName;
    }

    if (settings.profileImage) {
        displayProfileImage(settings.profileImage);
    }
}

// Greeting and date functions
function updateGreeting() {
    if (!greetingElement) return;

    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = 'Good Morning';
    } else if (hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour < 21) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Good Night';
    }

    const name = settings.profileName || '';
    greetingElement.textContent = name ? `${greeting}, ${name}!` : greeting;
}

function updateCurrentDate() {
    if (!currentDateElement) return;

    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    currentDateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
