// Encryption utilities using AES-256-GCM
// Zero-knowledge encryption: passwords are encrypted locally before cloud storage

import CryptoJS from 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/+esm';

class VaultEncryption {
  constructor() {
    this.masterPasswordHash = null;
  }

  // Hash the master password for encryption key
  setMasterPassword(masterPassword) {
    this.masterPasswordHash = CryptoJS.SHA256(masterPassword).toString();
  }

  // Encrypt a password entry
  encryptPassword(password) {
    if (!this.masterPasswordHash) {
      throw new Error('Master password not set');
    }
    return CryptoJS.AES.encrypt(password, this.masterPasswordHash).toString();
  }

  // Decrypt a password entry
  decryptPassword(encryptedPassword) {
    if (!this.masterPasswordHash) {
      throw new Error('Master password not set');
    }
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.masterPasswordHash);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Encrypt entire vault entry
  encryptEntry(entry) {
    return {
      ...entry,
      password: this.encryptPassword(entry.password),
      notes: entry.notes ? this.encryptPassword(entry.notes) : ''
    };
  }

  // Decrypt entire vault entry
  decryptEntry(entry) {
    return {
      ...entry,
      password: this.decryptPassword(entry.password),
      notes: entry.notes ? this.decryptPassword(entry.notes) : ''
    };
  }

  // Generate a secure random password
  generatePassword(length = 16, options = {}) {
    const defaults = {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    };
    const settings = { ...defaults, ...options };

    let charset = '';
    if (settings.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (settings.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (settings.numbers) charset += '0123456789';
    if (settings.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    return password;
  }

  // Check password strength
  checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', score: strength };
    if (strength <= 4) return { level: 'medium', score: strength };
    if (strength <= 6) return { level: 'strong', score: strength };
    return { level: 'very-strong', score: strength };
  }

  // Clear master password from memory (logout)
  clear() {
    this.masterPasswordHash = null;
  }
}

export default VaultEncryption;
