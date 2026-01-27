export interface CreateOrderParams {
  market: string;
  side: 'buy' | 'sell';
  quantity: string;
  leverage: number;
  reduceOnly?: boolean;
}

export interface CreateLimitOrderParams extends CreateOrderParams {
  price: string;
  postOnly?: boolean;
}

export interface CreateStopMarketOrderParams extends CreateOrderParams {
  triggerPrice: string;
  triggerType: 'index' | 'last';
}

export interface CreateStopLimitOrderParams extends CreateOrderParams {
  triggerPrice: string;
  triggerType: 'index' | 'last';
  price: string;
  postOnly?: boolean;
}

export interface CreateTakeProfitOrderParams extends CreateOrderParams {
  triggerPrice: string;
  triggerType: 'index' | 'last';
}

export interface CreateStopLossOrderParams extends CreateOrderParams {
  triggerPrice: string;
  triggerType: 'index' | 'last';
}

export interface OrderState {
  isSubmitting: boolean;
  error: string | null;
  orderResult: any;
}

export interface TypedDataResponse {
  nonce: string;
  typedData: {
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  };
  formattedQuantity: string;
}
