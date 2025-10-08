import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { erc20Abi, type Address } from 'viem';
import { multicall } from 'wagmi/actions';
import { useWeb3 } from '../contexts/useWeb3';
import type { TAddress } from '@/lib/yearnfi/lib/types/address';
import type { TChainTokens, TDict, TNDict, TNormalizedBN, TToken } from '@/lib/yearnfi/lib/types/mixed';
import { AGGREGATE3_ABI } from '@/lib/yearnfi/lib/abis/aggregate.abi';
import { ETH_TOKEN_ADDRESS, MULTICALL3_ADDRESS } from '@/lib/yearnfi/vaults-v3/constants';
import { decodeAsBigInt, decodeAsNumber, decodeAsString } from '@/lib/yearnfi/lib/utils/decoder';
// import { toNormalizedBN } from '@/lib/yearnfi/lib/utils';
import { toAddress } from '@/lib/yearnfi/lib/utils/tools.address';
import { isEthAddress,  isZeroAddress } from '@/lib/yearnfi/lib/utils/tools.address';
import { retrieveConfig } from '../utils/wagmi/index';
import { getNetwork } from '../utils/wagmi/index';

export type TUseBalancesTokens = {
  address: TAddress;
  chainID: number;
  decimals?: number;
  name?: string;
  symbol?: string;
};

type TUpdates = TDict<TToken & { lastUpdate: number; owner: TAddress }>;
const TOKEN_UPDATE: TUpdates = {};

function toNormalizedBN(raw: bigint, decimals: number): TNormalizedBN {
  const divisor = BigInt(10) ** BigInt(decimals);
  const normalized = Number(raw) / Number(divisor);
  
  return {
    raw,
    normalized,
    display: normalized.toFixed(decimals > 6 ? 6 : decimals)
  };
}

export async function getBalances(
  chainID: number,
  address: TAddress | undefined,
  tokens: TUseBalancesTokens[],
  shouldForceFetch = false
): Promise<[TDict<TToken>, Error | undefined]> {
  let result: TDict<TToken> = {};
  const ownerAddress = address;

  const calls: any[] = [];

  for (const element of tokens) {
    const { address: token } = element;

    const tokenUpdateInfo = TOKEN_UPDATE[`${chainID}/${toAddress(element.address)}`];
    if (tokenUpdateInfo?.lastUpdate && Date.now() - tokenUpdateInfo?.lastUpdate < 60_000 && !shouldForceFetch) {
      if (toAddress(tokenUpdateInfo.owner) === toAddress(ownerAddress)) {
        result[toAddress(token)] = tokenUpdateInfo;
        continue;
      }
    }

    if (isEthAddress(token)) {
      const network = getNetwork(chainID);
      const multicall3Contract = {
        address: (network.contracts.multicall3?.address || MULTICALL3_ADDRESS) as Address,
        abi: AGGREGATE3_ABI
      };
      const baseContract = { address: ETH_TOKEN_ADDRESS as Address, abi: erc20Abi };
      
      if (element.decimals === undefined || element.decimals === 0) {
        calls.push({ ...baseContract, functionName: 'decimals' });
      }
      if (element.symbol === undefined || element.symbol === '') {
        calls.push({ ...baseContract, functionName: 'symbol' });
      }
      if (element.name === undefined || element.name === '') {
        calls.push({ ...baseContract, functionName: 'name' });
      }
      if (ownerAddress) {
        calls.push({
          ...multicall3Contract,
          functionName: 'getEthBalance',
          args: [ownerAddress]
        });
      }
    } else {
      const baseContract = { address: token as Address, abi: erc20Abi };
      
      if (element.decimals === undefined || element.decimals === 0) {
        calls.push({ ...baseContract, functionName: 'decimals' });
      }
      if (element.symbol === undefined || element.symbol === '') {
        calls.push({ ...baseContract, functionName: 'symbol' });
      }
      if (element.name === undefined || element.name === '') {
        calls.push({ ...baseContract, functionName: 'name' });
      }
      if (ownerAddress) {
        calls.push({ ...baseContract, functionName: 'balanceOf', args: [ownerAddress] });
      }
    }
  }

  try {
    const results = await multicall(retrieveConfig(), {
      contracts: calls as any,
      chainId: chainID as any
    });

    const _data: TDict<TToken> = {};
    const hasOwnerAddress = Boolean(ownerAddress) && !isZeroAddress(ownerAddress);
    const tokensAsObject: TDict<TUseBalancesTokens> = {};
    
    for (const token of tokens) {
      tokensAsObject[toAddress(token.address)] = token;
    }

    let callIndex = 0;
    for (const element of tokens) {
      const { address, decimals: injectedDecimals, name: injectedName, symbol: injectedSymbol } = element;
      
      if (!_data[toAddress(address)]) {
        _data[toAddress(address)] = {
          address: address,
          name: injectedName || '',
          symbol: injectedSymbol || '',
          decimals: injectedDecimals || 0,
          chainID: chainID,
          balance: toNormalizedBN(BigInt(0), injectedDecimals || 0),
          value: 0
        };
      }

      const decimals = _data[toAddress(address)].decimals || injectedDecimals || 0;

      if (injectedDecimals === undefined || injectedDecimals === 0) {
        const decimalResult = results[callIndex];
        if (decimalResult?.status === 'success') {
          _data[toAddress(address)].decimals = decodeAsNumber(decimalResult) || 18;
        }
        callIndex++;
      }

      if (injectedSymbol === undefined || injectedSymbol === '') {
        const symbolResult = results[callIndex];
        if (symbolResult?.status === 'success') {
          _data[toAddress(address)].symbol = decodeAsString(symbolResult) || '';
        }
        callIndex++;
      }

      if (injectedName === undefined || injectedName === '') {
        const nameResult = results[callIndex];
        if (nameResult?.status === 'success') {
          _data[toAddress(address)].name = decodeAsString(nameResult) || '';
        }
        callIndex++;
      }

      if (hasOwnerAddress) {
        const balanceResult = results[callIndex];
        if (balanceResult?.status === 'success') {
          const balanceOf = decodeAsBigInt(balanceResult);
          _data[toAddress(address)].balance = toNormalizedBN(balanceOf, _data[toAddress(address)].decimals);
        }
        callIndex++;
      }

      TOKEN_UPDATE[`${chainID}/${toAddress(address)}`] = {
        ..._data[toAddress(address)],
        owner: toAddress(ownerAddress),
        lastUpdate: Date.now()
      };
    }

    return [_data, undefined];
  } catch (error) {
    console.error('Failed to fetch balances:', error);
    return [result, error as Error];
  }
}