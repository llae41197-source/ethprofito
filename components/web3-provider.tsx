"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { arbitrum, base, mainnet, optimism, polygon } from "wagmi/chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
  injected(),
  coinbaseWallet({
    appName: "ethprofito",
    appLogoUrl: "https://ethprofito.com/favicon.ico"
  }),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: {
            name: "ethprofito",
            description: "ethprofito wallet sign-in",
            url: "https://ethprofito.com",
            icons: ["https://ethprofito.com/favicon.ico"]
          },
          showQrModal: true
        })
      ]
    : [])
];

const config = createConfig({
  chains: [base, mainnet, optimism, arbitrum, polygon],
  connectors,
  ssr: false,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http()
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
