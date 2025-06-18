import { ethers } from "ethers";
import { create } from "zustand";

type userStore = {
  address: string;
  provider: ethers.providers.Web3Provider | null;
  setAddress: (address: string) => void;
  setProvider: (provider: ethers.providers.Web3Provider) => void;
};

export const useUserStore = create<userStore>((set) => ({
  address: "",
  provider: null,
  setAddress: (address: string) => {
    set(() => ({ address }));
  },
  setProvider: (provider: ethers.providers.Web3Provider) => {
    set(() => ({ provider }));
  },
}));
