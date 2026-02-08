// Vault Dashboard Logic
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc,
  query,
  where 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import VaultEncryption from './encryption.js';

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize encryption
const encryption = new VaultEncryption();

// Get user info
const userId = localStorage.getItem('userId');
const userEmail = localStorage.getItem('userEmail');
const masterPasswordHash = sessionStorage.getItem('masterPasswordHash');

// Redirect if not authenticated
if (!userId || !masterPasswordHash) {
  window.location.href = 'index.html';
}

// Verify Firebase Auth state
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log('Vault - User authenticated:', user.uid);
  } else {
    console.log('Vault - No user authenticated, redirecting');
    window.location.href = 'index.html';
  }
});

// Set master password for encryption
encryption.setMasterPassword(masterPasswordHash);

// State
let passwords = [];
let currentCategory = 'all';
let editingPasswordId = null;

// DOM Elements
const cardsGrid = document.getElementById('cardsGrid');
const editPanel = document.getElementById('editPanel');
const addPasswordBtn = document.getElementById('addPasswordBtn');
const closePanel = document.getElementById('closePanel');
const passwordForm = document.getElementById('passwordForm');
const searchInput = document.getElementById('searchInput');
const categoryItems = document.querySelectorAll('.category-item');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const accountEmail = document.getElementById('accountEmail');
const deleteBtn = document.getElementById('deleteBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Form fields
const websiteName = document.getElementById('websiteName');
const websiteUrl = document.getElementById('websiteUrl');
const username = document.getElementById('username');
const passwordField = document.getElementById('passwordField');
const category = document.getElementById('category');
const notes = document.getElementById('notes');
const generateBtn = document.getElementById('generateBtn');
const strengthBar = document.getElementById('strengthBar');
const panelTitle = document.getElementById('panelTitle');
const saveBtn = document.getElementById('saveBtn');

// Category icons
const categoryIcons = {
  banking: '🏦',
  email: '📧',
  social: '🌐',
  gaming: '🎮',
  work: '💼',
  other: '📌'
};

// Load passwords from Firestore
async function loadPasswords() {
  try {
    const passwordsRef = collection(db, 'users', userId, 'passwords');
    const snapshot = await getDocs(passwordsRef);
    
    passwords = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Decrypt password and notes
      try {
        const decrypted = encryption.decryptEntry(data);
        passwords.push({
          id: doc.id,
          ...decrypted
        });
      } catch (error) {
        console.error('Failed to decrypt password:', error);
      }
    });

    renderPasswords();
  } catch (error) {
    console.error('Error loading passwords:', error);
  }
}

// Render password cards
function renderPasswords() {
  const filtered = passwords.filter(p => {
    const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
    const matchesSearch = searchInput.value === '' || 
      p.website.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      p.username.toLowerCase().includes(searchInput.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    cardsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
        <h3 style="font-size: 1.5rem; margin-bottom: 10px;">No passwords found</h3>
        <p>Click the ➕ button to add your first password</p>
      </div>
    `;
    return;
  }

  cardsGrid.innerHTML = filtered.map(p => `
    <div class="password-card fade-in" data-id="${p.id}">
      <div class="card-header">
        <div class="card-icon">${categoryIcons[p.category] || '📌'}</div>
        <div class="card-title">
          <h3>${p.website}</h3>
          <p>${p.username}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="password-display">••••••••</div>
        <div class="card-actions">
          <button class="action-btn show-password" data-password="${p.password}" title="Show Password">👁</button>
          <button class="action-btn copy-password" data-password="${p.password}" title="Copy Password">📋</button>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners
  document.querySelectorAll('.password-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('action-btn') && 
          !e.target.classList.contains('show-password') && 
          !e.target.classList.contains('copy-password')) {
        openEditPanel(card.dataset.id);
      }
    });
  });

  document.querySelectorAll('.show-password').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const passwordDisplay = btn.closest('.card-body').querySelector('.password-display');
      if (passwordDisplay.textContent === '••••••••') {
        passwordDisplay.textContent = btn.dataset.password;
        btn.textContent = '🙈';
      } else {
        passwordDisplay.textContent = '••••••••';
        btn.textContent = '👁';
      }
    });
  });

  document.querySelectorAll('.copy-password').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(btn.dataset.password);
        btn.textContent = '✓';
        setTimeout(() => {
          btn.textContent = '📋';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    });
  });
}

// Open edit panel for new password
function openAddPanel() {
  editingPasswordId = null;
  panelTitle.textContent = 'Add Password';
  deleteBtn.style.display = 'none';
  saveBtn.textContent = 'Save';
  
  // Clear form
  passwordForm.reset();
  strengthBar.className = 'strength-bar';
  
  editPanel.classList.add('active');
}

// Open edit panel for existing password
function openEditPanel(passwordId) {
  editingPasswordId = passwordId;
  panelTitle.textContent = 'Edit Password';
  deleteBtn.style.display = 'block';
  saveBtn.textContent = 'Update';
  
  const password = passwords.find(p => p.id === passwordId);
  if (password) {
    websiteName.value = password.website;
    websiteUrl.value = password.url || '';
    username.value = password.username;
    passwordField.value = password.password;
    category.value = password.category;
    notes.value = password.notes || '';
    
    updateStrengthIndicator(password.password);
  }
  
  editPanel.classList.add('active');
}

// Close edit panel
function closeEditPanel() {
  editPanel.classList.remove('active');
  editingPasswordId = null;
  passwordForm.reset();
}

// Update password strength indicator
function updateStrengthIndicator(password) {
  const strength = encryption.checkPasswordStrength(password);
  strengthBar.className = `strength-bar ${strength.level}`;
}

// Generate random password
function generatePassword() {
  const generatedPassword = encryption.generatePassword(16, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  
  passwordField.type = 'text';
  passwordField.value = generatedPassword;
  updateStrengthIndicator(generatedPassword);
  
  setTimeout(() => {
    passwordField.type = 'password';
  }, 3000);
}

// Save password
async function savePassword(e) {
  e.preventDefault();
  
  const passwordData = {
    website: websiteName.value,
    url: websiteUrl.value,
    username: username.value,
    password: passwordField.value,
    category: category.value,
    notes: notes.value,
    updatedAt: new Date().toISOString()
  };

  try {
    // Encrypt before saving
    const encrypted = encryption.encryptEntry(passwordData);
    
    if (editingPasswordId) {
      // Update existing
      await setDoc(doc(db, 'users', userId, 'passwords', editingPasswordId), {
        ...encrypted,
        createdAt: passwords.find(p => p.id === editingPasswordId).createdAt
      });
    } else {
      // Create new
      const newId = Date.now().toString();
      await setDoc(doc(db, 'users', userId, 'passwords', newId), {
        ...encrypted,
        createdAt: new Date().toISOString()
      });
    }

    closeEditPanel();
    await loadPasswords();
  } catch (error) {
    console.error('Error saving password:', error);
    alert('Failed to save password: ' + error.message);
  }
}

// Delete password
async function deletePassword() {
  if (!editingPasswordId) return;
  
  if (confirm('Are you sure you want to delete this password?')) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'passwords', editingPasswordId));
      closeEditPanel();
      await loadPasswords();
    } catch (error) {
      console.error('Error deleting password:', error);
      alert('Failed to delete password: ' + error.message);
    }
  }
}

// Category filtering
categoryItems.forEach(item => {
  item.addEventListener('click', () => {
    categoryItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    currentCategory = item.dataset.category;
    renderPasswords();
  });
});

// Search
searchInput.addEventListener('input', () => {
  renderPasswords();
});

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  themeToggle.classList.toggle('active');
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
  themeToggle.classList.add('active');
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    sessionStorage.clear();
    encryption.clear();
    window.electronAPI.navigateToLogin();
  }
}

// Event Listeners
addPasswordBtn.addEventListener('click', openAddPanel);
closePanel.addEventListener('click', closeEditPanel);
cancelBtn.addEventListener('click', closeEditPanel);
passwordForm.addEventListener('submit', savePassword);
deleteBtn.addEventListener('click', deletePassword);
generateBtn.addEventListener('click', generatePassword);
passwordField.addEventListener('input', (e) => updateStrengthIndicator(e.target.value));
settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
closeSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
themeToggle.addEventListener('click', toggleTheme);
logoutBtn.addEventListener('click', logout);

// Set account email in settings
accountEmail.textContent = userEmail;

// Change master password
document.getElementById('changeMasterPasswordBtn').addEventListener('click', () => {
  alert('This feature allows you to change your master password. Implementation requires re-encrypting all passwords with the new master password.');
  // TODO: Implement master password change
});

// Close modal on outside click
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

// Initial load
loadPasswords();
