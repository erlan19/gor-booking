declare module 'midtrans-client' {
  namespace MidtransClient {
    interface SnapOptions {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    }

    interface TransactionDetails {
      order_id: string;
      gross_amount: number;
    }

    interface CustomerDetails {
      first_name?: string;
      email?: string;
      phone?: string;
    }

    interface CreateTransactionParams {
      transaction_details: TransactionDetails;
      customer_details?: CustomerDetails;
    }

    interface TransactionResult {
      token: string;
      redirect_url: string;
      transaction_id: string;
    }

    class Snap {
      constructor(options: SnapOptions);
      createTransaction(params: CreateTransactionParams): Promise<TransactionResult>;
    }
  }

  export default MidtransClient;
}
