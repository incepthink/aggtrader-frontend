import { ethers } from "ethers";
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
  type ReserveDataHumanized,
  type UserReserveDataHumanized,
  type ReservesIncentiveDataHumanized,
  type UserReservesIncentivesDataHumanized,
} from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import type { ReservesData, UserReservesData } from "../../types/aave";

class AaveService {
  private provider: ethers.providers.JsonRpcProvider;
  private poolDataProviderContract: UiPoolDataProvider;
  private incentiveDataProviderContract: UiIncentiveDataProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://eth-mainnet.public.blastapi.io"
    );

    this.poolDataProviderContract = new UiPoolDataProvider({
      uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
      provider: this.provider,
      chainId: ChainId.mainnet,
    });

    this.incentiveDataProviderContract = new UiIncentiveDataProvider({
      uiIncentiveDataProviderAddress:
        markets.AaveV3Ethereum.UI_INCENTIVE_DATA_PROVIDER,
      provider: this.provider,
      chainId: ChainId.mainnet,
    });
  }

  async getReserves(): Promise<ReservesData> {
    try {
      const reserves = await this.poolDataProviderContract.getReservesHumanized(
        {
          lendingPoolAddressProvider:
            markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
        }
      );
      return reserves;
    } catch (error) {
      console.error("Error fetching reserves:", error);
      throw new Error("Failed to fetch reserves data");
    }
  }

  async getUserReserves(
    userAddress: string
  ): Promise<UserReserveDataHumanized[]> {
    try {
      const userReserves =
        await this.poolDataProviderContract.getUserReservesHumanized({
          lendingPoolAddressProvider:
            markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
          user: userAddress,
        });
      return userReserves.userReserves;
    } catch (error) {
      console.error("Error fetching user reserves:", error);
      throw new Error("Failed to fetch user reserves data");
    }
  }

  async getReserveIncentives(): Promise<ReservesIncentiveDataHumanized[]> {
    try {
      const reserveIncentives =
        await this.incentiveDataProviderContract.getReservesIncentivesDataHumanized(
          {
            lendingPoolAddressProvider:
              markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
          }
        );
      return reserveIncentives;
    } catch (error) {
      console.error("Error fetching reserve incentives:", error);
      throw new Error("Failed to fetch reserve incentives data");
    }
  }

  async getUserIncentives(
    userAddress: string
  ): Promise<UserReservesIncentivesDataHumanized[]> {
    try {
      const userIncentives =
        await this.incentiveDataProviderContract.getUserReservesIncentivesDataHumanized(
          {
            lendingPoolAddressProvider:
              markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
            user: userAddress,
          }
        );
      return userIncentives;
    } catch (error) {
      console.error("Error fetching user incentives:", error);
      throw new Error("Failed to fetch user incentives data");
    }
  }
}

export const aaveService = new AaveService();
