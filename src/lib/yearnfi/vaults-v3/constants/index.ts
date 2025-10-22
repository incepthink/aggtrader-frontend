import { toAddress } from "../../lib/utils/tools.address";

export const ALL_VAULTSV3_KINDS_KEYS = ['Fancy', 'Multi Strategy', 'Single Strategy'];

export const ALL_VAULTSV3_CATEGORIES_KEYS = [
  'Stablecoin',
  'Curve',
  'Volatile',
];

export const ETHEREUM_CHAIN_ID = 1;
export const KATANA_CHAIN_ID = 747474;

export const SUPPORTED_V3_CHAINS = [ KATANA_CHAIN_ID];

export const ETH_TOKEN_ADDRESS = toAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
export const MULTICALL3_ADDRESS = toAddress('0xcA11bde05977b3631167028862bE2a173976CA11')