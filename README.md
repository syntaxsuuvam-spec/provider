# @sorocrew/provider

[![npm version](https://img.shields.io/npm/v/@sorocrew/provider.svg?color=2563EB)](https://www.npmjs.com/package/@sorocrew/provider)
[![npm downloads](https://img.shields.io/npm/dm/@sorocrew/provider.svg)](https://www.npmjs.com/package/@sorocrew/provider)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)

![SoroCrew Logo](./crew-logo-white.svg)

> **Injected window.stellar & Freighter-compatible Mock Wallet SDK** for Soroban dApp testing inside SoroCrew Studio.

`@sorocrew/provider` injects `window.sorocrew` and `window.freighter` into any web application testing frame. It enables dApp developers to test network switching, account keypairs, and Soroban contract signing without relying on browser extension popups.

---

## Installation

```bash
npm install @sorocrew/provider
# or
pnpm add @sorocrew/provider
```

---

## Quick Start

### Core Methods

```typescript
import { isConnected, getPublicKey, getNetwork, signTransaction } from '@sorocrew/provider';

// 1. Check if mock provider is active in the current frame
const connected = await isConnected();

// 2. Fetch active signer public key (mock Freighter keypair)
const publicKey = await getPublicKey();
console.log('Active Public Key:', publicKey);

// 3. Read current runtime network endpoint
const networkUrl = await getNetwork();
console.log('Target Network:', networkUrl);

// 4. Sign Soroban Transaction Envelope XDR
const signedXdr = await signTransaction(xdrBase64, { networkPassphrase });
```

---

## Framework Integrations

### React & Vite (`useSoroCrew` Custom Hook)

A reusable hook handling connection lifecycle and automatic event listener teardown. See full code in [`examples/react-vite-example.tsx`](./examples/react-vite-example.tsx).

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { isConnected, getPublicKey, getNetwork } from '@sorocrew/provider';

export function useSoroCrew() {
  const [wallet, setWallet] = useState<{ connected: boolean; publicKey: string | null; network: string | null }>({
    connected: false,
    publicKey: null,
    network: null,
  });

  const sync = useCallback(async () => {
    if (await isConnected()) {
      const [publicKey, network] = await Promise.all([getPublicKey(), getNetwork()]);
      setWallet({ connected: true, publicKey, network });
    }
  }, []);

  useEffect(() => {
    sync();

    // Listen to network changes triggered from SoroCrew Studio
    const onNetwork = (details: { networkUrl: string }) => {
      setWallet((prev) => ({ ...prev, network: details.networkUrl }));
    };

    if (typeof window !== 'undefined' && window.sorocrew) {
      window.sorocrew.on('networkChange', onNetwork);
    }

    // Teardown listener on component unmount
    return () => {
      if (typeof window !== 'undefined' && window.sorocrew?.off) {
        window.sorocrew.off('networkChange', onNetwork);
      }
    };
  }, [sync]);

  return { ...wallet, reconnect: sync };
}
```

### Next.js (App Router Client Component)

In Next.js 13+ / 14+ / 15+, mark your wallet component with `'use client'`:

```tsx
'use client';

import { useSoroCrew } from '@/hooks/useSoroCrew';

export function ConnectWalletHeader() {
  const { connected, publicKey, network } = useSoroCrew();

  if (!connected) {
    return <span className="text-gray-500">Provider not detected</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}</span>
      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{network}</span>
    </div>
  );
}
```

---

## Event Listener Cleanup Patterns

Always unregister SoroCrew event listeners when destroying component scopes to prevent memory leaks in single-page applications:

```typescript
// Subscribe
window.sorocrew.on('networkChange', handleNetworkChange);
window.sorocrew.on('accountChange', handleAccountChange);

// Unsubscribe
window.sorocrew.off('networkChange', handleNetworkChange);
window.sorocrew.off('accountChange', handleAccountChange);
```

---

## Community & Support

* **Telegram Community:** [https://t.me/sorocrew](https://t.me/sorocrew)
* **GitHub Organization:** [https://github.com/sorocrew](https://github.com/sorocrew)

---

## Contributing

All pull requests should target the `dev` branch. See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines and [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup.

---

## License

MIT © [SoroCrew](https://github.com/sorocrew)
