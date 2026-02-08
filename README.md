# Vault

<p align="center">
  <img src="assets/icon.png" alt="Vault" width="150"/>
</p>

<p align="center">
  <strong>Secure password manager with zero-knowledge encryption</strong>
</p>

---

## Overview

Vault is a free, cross-platform password manager that encrypts your data locally before syncing to the cloud. Your master password never leaves your device, ensuring complete privacy.

## Features

- **AES-256 Encryption** - Military-grade security
- **Zero-Knowledge Architecture** - Your data stays private
- **Cloud Sync** - Access anywhere
- **Password Generator** - Strong password creation
- **Cross-Platform** - Windows, macOS, Linux

## Download

Download the latest installer from the [Releases](https://github.com/1LOK-TECH/Vault/releases) page.

**The installer includes all necessary configuration. Just download and install.**

## Running from Source

If you want to run from source code, you'll need to configure your own Firebase project:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get your Firebase config
5. Update the `firebaseConfig` object in:
   - `src/index.html`
   - `src/master-password.html`
   - `src/vault.js`

Then run:
```bash
npm install
npm start
```

## Security

All passwords are encrypted with AES-256 before being stored. Your master password is used to generate the encryption key and never leaves your device. Even if our servers are compromised, your data remains secure.

**Important:** Your master password cannot be recovered. Store it securely.

## License

MIT License - See [LICENSE](LICENSE) for details.

**Copyright © 2026 1LOK. All rights reserved.**

---

Built by 1LOK

