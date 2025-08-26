// utils/sushiswapV3Fallback.ts
import { ethers, BigNumber } from "ethers";
import { Address } from "viem";

// Katana RPC configuration
const KATANA_RPC_URL = "https://rpc.katana.network";
const SUSHISWAP_V3_FACTORY_ADDRESS = "0x203e8740894c8955cb8950759876d7e7e45e04c1";

// Common token addresses on Katana (you may need to update these)
const KATANA_TOKENS = {
  WETH: "0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62", // Add actual WETH address on Katana
  USDC: "0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36", // Add actual USDC address on Katana
  USDT: "0x2DCa96907fde857dd3D816880A0df407eeB2D2F2", // Add actual USDT address on Katana
} as const;

// SushiSwap V3 Factory ABI (minimal interface)
const SUSHISWAP_V3_FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
];

// SushiSwap V3 Pool ABI (minimal interface)
const SUSHISWAP_V3_POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];

// ERC20 ABI (minimal interface)
const ERC20_ABI = [
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

// Common fee tiers for SushiSwap V3
const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

interface PoolInfo {
  poolAddress: string;
  token0: string;
  token1: string;
  fee: number;
  sqrtPriceX96: BigNumber;
  decimals0: number;
  decimals1: number;
}

class SushiswapV3PriceFetcher {
  private provider: ethers.providers.JsonRpcProvider;
  private factoryContract: ethers.Contract;

  constructor() {
    // Use StaticJsonRpcProvider to avoid ENS operations
    this.provider = new ethers.providers.StaticJsonRpcProvider(
      KATANA_RPC_URL,
      {
        name: "katana",
        chainId: 747474,
      }
    );
    
    this.factoryContract = new ethers.Contract(
      SUSHISWAP_V3_FACTORY_ADDRESS,
      SUSHISWAP_V3_FACTORY_ABI,
      this.provider
    );
  }

  /**
   * Calculate token price from sqrtPriceX96
   */
  private calculatePrice(
    sqrtPriceX96: BigNumber,
    decimals0: number,
    decimals1: number,
    token0IsTarget: boolean
  ): number {
    // Convert sqrtPriceX96 to actual price using ethers v5 BigNumber
    const Q96 = BigNumber.from(2).pow(96);
    const numerator = sqrtPriceX96.mul(sqrtPriceX96);
    const denominator = Q96.mul(Q96);
    
    // Convert to decimal number for price calculation
    const priceRaw = parseFloat(numerator.toString()) / parseFloat(denominator.toString());
    
    // Adjust for decimals
    const decimalAdjustment = Math.pow(10, decimals1 - decimals0);
    const adjustedPrice = priceRaw * decimalAdjustment;
    
    // If token0 is our target token, we want price in terms of token1
    // If token1 is our target token, we want the inverse
    return token0IsTarget ? adjustedPrice : 1 / adjustedPrice;
  }

  /**
   * Get token decimals
   */
  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      return await tokenContract.decimals();
    } catch (error) {
      console.warn(`Failed to get decimals for ${tokenAddress}, using default 18`);
      return 18; // Default to 18 decimals
    }
  }

  /**
   * Find the best pool for a token pair
   */
  private async findBestPool(
    tokenA: string,
    tokenB: string
  ): Promise<PoolInfo | null> {
    const pools: PoolInfo[] = [];

    // Try different fee tiers
    for (const fee of FEE_TIERS) {
      try {
        const poolAddress = await this.factoryContract.getPool(tokenA, tokenB, fee);
        
        if (poolAddress === ethers.constants.AddressZero) {
          continue; // Pool doesn't exist
        }

        const poolContract = new ethers.Contract(
          poolAddress,
          SUSHISWAP_V3_POOL_ABI,
          this.provider
        );

        const [slot0Result, token0, token1] = await Promise.all([
          poolContract.slot0(),
          poolContract.token0(),
          poolContract.token1(),
        ]);

        const [decimals0, decimals1] = await Promise.all([
          this.getTokenDecimals(token0),
          this.getTokenDecimals(token1),
        ]);

        pools.push({
          poolAddress,
          token0: token0.toLowerCase(),
          token1: token1.toLowerCase(),
          fee,
          sqrtPriceX96: slot0Result[0],
          decimals0,
          decimals1,
        });
      } catch (error) {
        console.warn(`Failed to get pool for fee ${fee}:`, error);
        continue;
      }
    }

    // Return the pool with the lowest fee (highest liquidity typically)
    return pools.sort((a, b) => a.fee - b.fee)[0] || null;
  }

  /**
   * Get token price in USD by finding a path through common tokens
   */
  async getTokenPriceUSD(tokenAddress: string): Promise<number | null> {
    const targetToken = tokenAddress.toLowerCase();
    
    // Try to find price against common base tokens
    const baseTokens = Object.values(KATANA_TOKENS).filter(Boolean);
    
    for (const baseToken of baseTokens) {
      if (!baseToken || baseToken.toLowerCase() === targetToken) continue;
      
      try {
        const pool = await this.findBestPool(targetToken, baseToken.toLowerCase());
        console.log("POOLS", pool);
        
        if (!pool) continue;

        const token0IsTarget = pool.token0 === targetToken;
        const price = this.calculatePrice(
          pool.sqrtPriceX96,
          pool.decimals0,
          pool.decimals1,
          token0IsTarget
        );

        // For now, we'll return the price against the base token
        // In a real implementation, you'd need to get the USD price of the base token
        // and multiply to get the final USD price
        console.log(`Found price for ${tokenAddress} against ${baseToken}: ${price}`);
        
        // This is a simplified approach - you should implement proper USD conversion
        // For now, assuming the base token price is 1 USD (this needs to be improved)
        return price;
        
      } catch (error) {
        console.warn(`Failed to get price against ${baseToken}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Get price ratio between two tokens
   */
  async getTokenPairPrice(
    tokenA: string,
    tokenB: string
  ): Promise<number | null> {
    try {
      const pool = await this.findBestPool(
        tokenA.toLowerCase(),
        tokenB.toLowerCase()
      );
      console.log("POOL", pool);
      

      if (!pool) {
        return null;
      }

      const token0IsTokenA = pool.token0 === tokenA.toLowerCase();
      const price = this.calculatePrice(
        pool.sqrtPriceX96,
        pool.decimals0,
        pool.decimals1,
        token0IsTokenA
      );

      console.log("PRICE", price);
      

      return price;
    } catch (error) {
      console.error("Failed to get token pair price:", error);
      return null;
    }
  }
}

// Export singleton instance
export const sushiswapV3Fetcher = new SushiswapV3PriceFetcher();

// Export main functions
export async function fetchTokenPriceFromSushiV3(
  tokenAddress: Address
): Promise<number | null> {
  try {
    return await sushiswapV3Fetcher.getTokenPriceUSD(tokenAddress);
  } catch (error) {
    console.error("SushiV3 fallback failed:", error);
    return null;
  }
}

export async function fetchTokenPairPriceFromSushiV3(
  tokenA: Address,
  tokenB: Address
): Promise<number | null> {
  try {
    return await sushiswapV3Fetcher.getTokenPairPrice(tokenA, tokenB);
  } catch (error) {
    console.error("SushiV3 pair price fallback failed:", error);
    return null;
  }
}