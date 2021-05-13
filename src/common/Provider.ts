import * as Providers from './.wallet3.rc.json';
import * as ethers from 'ethers';

import axios from 'axios';

// For bsc
// https://bscproject.org/#/rpcserver

const cache = new Map<number, ethers.providers.BaseProvider>();

export function getProviderByChainId(chainId: number) {
  if (cache.has(chainId)) {
    return cache.get(chainId);
  }

  const list = Providers[`${chainId}`] as string[];
  if (!list) {
    throw new Error(`Unsupported chain:${chainId}`);
  }

  const provider = new ethers.providers.JsonRpcProvider(list[0], chainId);
  cache.set(chainId, provider);
  return provider;
}

export async function sendTransaction(chainId: number, txHex: string) {
  const [url] = Providers[`${chainId}`] as string[];

  try {
    const resp = await axios.post(url, {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [txHex],
      id: Date.now(),
    });

    return resp.data as { id: number; result: string };
  } catch (error) {
    return '';
  }
}
