let allIssues = [];
let currentTab = 'all';
let searchTerm = '';
let viewedIssues = new Set();
let currentViewedCard = null;


localStorage.removeItem('viewedIssues');

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const issuesGrid = document.getElementById('issuesGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const issueModal = document.getElementById('issueModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const tabButtons = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const issuesCount = document.getElementById('issuesCount');

// API Endpoints
const API_BASE = 'https://phi-lab-server.vercel.app/api/v1/lab';
const ALL_ISSUES_API = `${API_BASE}/issues`;
const SINGLE_ISSUE_API = (id) => `${API_BASE}/issue/${id}`;
const SEARCH_API = (query) => `${API_BASE}/issues/search?q=${encodeURIComponent(query)}`;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => handleTabClick(e));
    });
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    modalClose.addEventListener('click', closeModal);
    issueModal.addEventListener('click', (e) => {
        if (e.target === issueModal) closeModal();
    });
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        fetchIssues();
    } else {
        loginError.textContent = 'Invalid username or password.';
        loginError.classList.add('show');
        
        setTimeout(() => {
            loginError.classList.remove('show');
        }, 3000);
    }
}

// Fetch All Issues
async function fetchIssues() {
    showLoading(true);
    
    try {
        const response = await fetch(ALL_ISSUES_API);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allIssues = data;
        } else if (data.issues && Array.isArray(data.issues)) {
            allIssues = data.issues;
        } else if (data.data && Array.isArray(data.data)) {
            allIssues = data.data;
        } else {
            allIssues = [];
        }
        
        displayIssues();
        
    } catch (error) {
        console.error('Error fetching issues:', error);
        allIssues = [];
        displayIssues();
    } finally {
        showLoading(false);
    }
}

// Handle Search
async function handleSearch() {
    searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        fetchIssues();
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(SEARCH_API(searchTerm));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allIssues = data;
        } else if (data.issues && Array.isArray(data.issues)) {
            allIssues = data.issues;
        } else if (data.data && Array.isArray(data.data)) {
            allIssues = data.data;
        } else {
            allIssues = [];
        }
        
        displayIssues();
        
    } catch (error) {
        console.error('Error searching issues:', error);
        allIssues = [];
        displayIssues();
    } finally {
        showLoading(false);
    }
}

// Handle Tab Click
function handleTabClick(e) {
    const tab = e.target.dataset.tab;
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentTab = tab;
    displayIssues();
}

// Display Issues
function displayIssues() {
    let filteredIssues = allIssues;
    
    if (currentTab === 'open') {
        filteredIssues = allIssues.filter(issue => 
            issue.status?.toLowerCase() === 'open'
        );
    } else if (currentTab === 'closed') {
        filteredIssues = allIssues.filter(issue => 
            issue.status?.toLowerCase() === 'closed'
        );
    }
    
    issuesCount.textContent = `${filteredIssues.length} Issues`;
    issuesGrid.innerHTML = '';
    
    if (filteredIssues.length === 0) {
        issuesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #586069;">
                <p style="font-size: 16px; margin-bottom: 8px;">No issues found</p>
            </div>
        `;
        return;
    }
    
    filteredIssues.forEach((issue, index) => {
        const issueId = issue._id || issue.id || issue.issueId || '';
        const isViewed = viewedIssues.has(issueId);
        
        const card = createIssueCard(issue, index + 1);
        issuesGrid.appendChild(card);
    });
}

// Create Issue Card - USING ASSETS ONLY
function createIssueCard(issue, issueNumber) {
    const card = document.createElement('div');
    card.className = 'issue-card';
    
    const issueId = issue._id || issue.id || issue.issueId || '';
    card.dataset.id = issueId;
    
    const isViewed = viewedIssues.has(issueId);
    
    if (isViewed) {
        card.classList.add('viewed');
    } else {
        card.classList.add('unviewed');
    }
    
    const status = issue.status || 'open';
    const priority = issue.priority || 'medium';
    const author = issue.author || issue.createdBy || issue.assignee || 'Unknown';
    const createdAt = formatDate(issue.createdAt || issue.created_at || issue.date);
    
    const title = issue.title || 'Untitled';
    const description = issue.description || 'No description provided';
    
    // Use Open-Status for unviewed, Closed-Status for viewed
    const statusIconSrc = isViewed ? 'assets/Closed-Status.png' : 'assets/Open-Status.png';
    
    card.innerHTML = `
        <div class="issue-card-content">
            <div class="card-header">
                <div class="status-icon">
                    <img src="${statusIconSrc}" alt="Status" class="status-icon-img">
                </div>
                <span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>
            </div>
            
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <p class="card-description">${escapeHtml(description)}</p>
            
            <div class="card-labels">
                <span class="card-label label-bug">BUG</span>
                <span class="card-label label-help-wanted">HELP WANTED</span>
            </div>
        </div>
        
        <div class="card-footer">
            <div class="card-meta">
                <span>#${issueNumber}</span>
                <span>by ${escapeHtml(author)}</span>
            </div>
            <div class="card-date">${createdAt}</div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        currentViewedCard = card;
        openModal(issueId);
    });
    
    return card;
}

// Update Card Icon
function updateCardIcon(card, isViewed) {
    const statusIconImg = card.querySelector('.status-icon-img');
    if (statusIconImg) {
        const newSrc = isViewed ? 'assets/Closed-Status.png' : 'assets/Open-Status.png';
        statusIconImg.src = newSrc;
    }
}

// Open Modal
async function openModal(issueId) {
    if (!issueId) {
        return;
    }
    
    issueModal.classList.add('show');
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    try {
        const url = SINGLE_ISSUE_API(issueId);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        let issue;
        if (data && data._id) {
            issue = data;
        } else if (data && data.issue && data.issue._id) {
            issue = data.issue;
        } else if (data && data.data && data.data._id) {
            issue = data.data;
        } else {
            issue = allIssues.find(i => (i._id || i.id) == issueId);
        }
        
        if (issue) {
            displayModalContent(issue);
        } else {
            modalBody.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #586069;">
                    <p>Issue not found</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error opening modal:', error);
        const issue = allIssues.find(i => (i._id || i.id) == issueId);
        if (issue) {
            displayModalContent(issue);
        } else {
            modalBody.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #586069;">
                    <p>Failed to load issue details</p>
                </div>
            `;
        }
    }
}

// Display Modal Content
function displayModalContent(issue) {
    const title = issue.title || 'Untitled';
    const status = issue.status || 'open';
    const priority = issue.priority || 'medium';
    const author = issue.author || issue.createdBy || issue.assignee || 'Unknown';
    const createdAt = issue.createdAt || issue.created_at || issue.date;
    const description = issue.description || 'No description provided';
    
    modalBody.innerHTML = `
        <button class="modal-close" onclick="closeModal()">×</button>
        
        <div class="modal-header">
            <h2 class="modal-title">${escapeHtml(title)}</h2>
            <div class="modal-meta">
                <span class="status-badge status-${status}">
                    ${status === 'open' ? 'Opened' : 'Closed'}
                </span>
                <span class="modal-meta-text">Opened by ${escapeHtml(author)}</span>
                <span class="modal-meta-text">${formatDateFull(createdAt)}</span>
            </div>
            <div class="modal-labels">
                <span class="modal-label label-bug">BUG</span>
                <span class="modal-label label-help-wanted">HELP WANTED</span>
            </div>
        </div>
        
        <p class="modal-description">${escapeHtml(description)}</p>
        
        <div class="modal-info-box">
            <div class="info-item">
                <span class="info-label">Assignee:</span>
                <span class="info-value">${escapeHtml(author)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Priority:</span>
                <span class="info-value">
                    <span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>
                </span>
            </div>
        </div>
        
        <div class="modal-footer">
            <button class="btn-close" onclick="closeModal()">Close</button>
        </div>
    `;
}

// Close Modal
function closeModal() {
    issueModal.classList.remove('show');
    
    if (currentViewedCard) {
        const issueId = currentViewedCard.dataset.id;
        
        if (!viewedIssues.has(issueId)) {
            // Mark as viewed
            viewedIssues.add(issueId);
            localStorage.setItem('viewedIssues', JSON.stringify([...viewedIssues]));
            
            // Change border from GREEN to PURPLE (Sign In button color)
            currentViewedCard.classList.remove('unviewed');
            currentViewedCard.classList.add('viewed');
            
            // Change icon from Open-Status to Closed-Status
            updateCardIcon(currentViewedCard, true);
        }
        
        currentViewedCard = null;
    }
}

// Show Loading
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
    issuesGrid.style.opacity = show ? '0.5' : '1';
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Unknown';
    }
}

// Format Date Full
function formatDateFull(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Unknown';
    }
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Search Input Listener
searchInput.addEventListener('input', debounce(() => {
    if (searchInput.value.trim().length >= 3 || searchInput.value.trim() === '') {
        handleSearch();
    }
}, 500));