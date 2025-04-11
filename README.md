# OBSCURA (Password Generator) 🔐

This is a client-side password generator built with Vue 3 and Vite. It allows users to create strong, customizable passwords based on best security practices.

## ✨ Features

- Password length between **12 and 64** characters
- Options to include:
    - Uppercase letters (`A-Z`)
    - Lowercase letters (`a-z`)
    - Numbers (`0-9`)
    - Special characters (`!"#$%&'()*+,-./:;<=>?@[]^_`{|}~`)
- Optional:
    - Start password with a letter
    - Exclude similar characters (`i, l, 1, L, o, 0, O`)
    - Disallow duplicate characters (⚠️ reduces entropy)
    - Avoid sequential characters (`abc`, `123`)
- Multi-password generation
- Secure copy-to-clipboard
- Password strength indicator based on entropy

## 🔒 Why Entropy Matters

**Entropy** is the measure of unpredictability in a password. In simple terms, it tells you how hard it is for an
attacker to guess or brute-force the password.

### 🎓 Entropy Formula

Entropy (in bits) can be approximated by:
`Entropy = log₂(N^L) = L × log₂(N)` where:
- `L` = password length
- `N` = number of possible characters (character set size)

Example:  
If you allow all 95 printable ASCII characters and choose a 16-character password:
That's a **very strong** password.  
An attacker trying to brute-force that would need to try `95^16` combinations — computationally infeasible.

### ⚠️ What reduces entropy?

- Enforcing "no duplicate characters"
- Excluding entire character sets (e.g., no numbers or no special symbols)
- Reducing password length
- Forcing certain patterns (like starting with a letter)

These restrictions **make the password more predictable**, so they should be used only for usability or system compatibility reasons.

---

## 🧪 Security Considerations

- All passwords are generated entirely **on the client side**.
- We use **`window.crypto.getRandomValues`**, which is part of the Web Cryptography API. It provides **cryptographically secure random numbers**.

### Why not `Math.random()`?

Because `Math.random()` is **not secure**. It's deterministic and predictable.  
Instead, `crypto.getRandomValues` uses the operating system's secure random source.

```ts
const array = new Uint32Array(1);
window.crypto.getRandomValues(array);
```

This ensures high entropy and randomness, essential for secure password generation.

📦 Tech Stack
•	Vue.js 3
•	Vite
•	TypeScript
•	Tailwind CSS

⸻

📈 Future Features
•	Entropy bar / strength meter
•	CSV export with optional client-side encryption
•	Save config presets locally
•	Support for passphrases (dice ware mode)

⸻

⚖️ License

MIT — feel free to use, fork, or contribute.

This project was built with privacy and cryptography in mind.


## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
