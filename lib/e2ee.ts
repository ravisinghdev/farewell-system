// ECDH (Elliptic Curve Diffie-Hellman) using Web Crypto API
// Curve: P-256 (NIST P-256)
// Encryption: AES-GCM 256-bit

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(exported);
}

export async function importPublicKey(jwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkJson);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(exported);
}

export async function importPrivateKey(jwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkJson);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// Derive a shared secret (AES-GCM key) from own private key and peer's public key
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable (for debugging, ideally false in prod)
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(
  content: string,
  sharedKey: CryptoKey
): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(content);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedKey,
    encoded
  );

  // Combine IV and ciphertext for storage
  // Format: IV (12 bytes) + Ciphertext
  const buffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(encrypted), iv.byteLength);

  // Return as Base64 string
  return btoa(String.fromCharCode(...buffer));
}

export async function decryptMessage(
  encryptedBase64: string,
  sharedKey: CryptoKey
): Promise<string> {
  try {
    const binaryString = atob(encryptedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    if (bytes.length < 12) {
      // throw new Error("Data too small for IV");
      console.warn("Data too small for IV, returning original");
      return encryptedBase64; // Return original content if it's not a valid encrypted packet
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "[Encrypted Message - Decryption Failed]";
  }
}
