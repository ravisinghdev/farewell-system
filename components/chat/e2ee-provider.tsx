"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage,
} from "@/lib/e2ee";
import { updatePublicKeyAction } from "@/app/actions/chat-actions";
import { toast } from "sonner";

interface E2EEContextType {
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  isReady: boolean;
  encrypt: (content: string, peerPublicKey: string) => Promise<string>;
  decrypt: (encryptedContent: string, peerPublicKey: string) => Promise<string>;
}

const E2EEContext = createContext<E2EEContextType | null>(null);

export function E2EEProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode;
  currentUserId: string;
}) {
  const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sharedKeys, setSharedKeys] = useState<Map<string, CryptoKey>>(
    new Map()
  );

  // Initialize Keys
  useEffect(() => {
    if (!currentUserId) return;

    const initKeys = async () => {
      try {
        const storedPub = localStorage.getItem(`e2ee_pub_${currentUserId}`);
        const storedPriv = localStorage.getItem(`e2ee_priv_${currentUserId}`);

        if (storedPub && storedPriv) {
          const pub = await importPublicKey(storedPub);
          const priv = await importPrivateKey(storedPriv);
          setPublicKey(pub);
          setPrivateKey(priv);
          setIsReady(true);
        } else {
          // Generate new keys
          const keyPair = await generateKeyPair();
          const pubJson = await exportPublicKey(keyPair.publicKey);
          const privJson = await exportPrivateKey(keyPair.privateKey);

          localStorage.setItem(`e2ee_pub_${currentUserId}`, pubJson);
          localStorage.setItem(`e2ee_priv_${currentUserId}`, privJson);

          setPublicKey(keyPair.publicKey);
          setPrivateKey(keyPair.privateKey);

          // Upload public key to server
          await updatePublicKeyAction(pubJson);
          setIsReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize E2EE keys:", error);
        toast.error("Encryption initialization failed");
      }
    };

    initKeys();
  }, [currentUserId]);

  const getSharedKey = useCallback(
    async (peerPublicKeyJson: string) => {
      if (!privateKey) throw new Error("Private key not ready");
      if (sharedKeys.has(peerPublicKeyJson)) {
        return sharedKeys.get(peerPublicKeyJson)!;
      }

      try {
        const peerPub = await importPublicKey(peerPublicKeyJson);
        const shared = await deriveSharedSecret(privateKey, peerPub);
        setSharedKeys((prev) => new Map(prev).set(peerPublicKeyJson, shared));
        return shared;
      } catch (e) {
        console.error("Failed to derive shared key:", e);
        throw e;
      }
    },
    [privateKey, sharedKeys]
  );

  const encrypt = useCallback(
    async (content: string, peerPublicKey: string) => {
      if (!isReady || !peerPublicKey) return content; // Fallback to plain if not ready
      try {
        const shared = await getSharedKey(peerPublicKey);
        return await encryptMessage(content, shared);
      } catch (e) {
        console.error("Encryption error:", e);
        return content;
      }
    },
    [isReady, getSharedKey]
  );

  const decrypt = useCallback(
    async (encryptedContent: string, peerPublicKey: string) => {
      if (!isReady || !peerPublicKey) return encryptedContent;
      try {
        const shared = await getSharedKey(peerPublicKey);
        return await decryptMessage(encryptedContent, shared);
      } catch (e) {
        // console.error("Decryption error:", e);
        return "[Decryption Error]";
      }
    },
    [isReady, getSharedKey]
  );

  return (
    <E2EEContext.Provider
      value={{ publicKey, privateKey, isReady, encrypt, decrypt }}
    >
      {children}
    </E2EEContext.Provider>
  );
}

export function useE2EE() {
  const context = useContext(E2EEContext);
  if (!context) {
    throw new Error("useE2EE must be used within an E2EEProvider");
  }
  return context;
}
