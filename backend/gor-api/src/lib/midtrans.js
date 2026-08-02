const MidtransClient = require('midtrans-client');
const { env } = require('../config/env');

let _snap: MidtransClient.Snap | null = null;

function getMidtransSnap() {
  if (!_snap) {
    _snap = new MidtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY || '',
      clientKey: env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return _snap;
}

/** Lazy proxy: first access initializes the Snap client */
const snap: MidtransClient.Snap = new Proxy({} as MidtransClient.Snap, {
  get(_target, prop, _receiver) {
    return (getMidtransSnap() as any)[prop];
  },
});

// ponytail: backward-compat wrapper; remove when all callers use `snap` directly
module.exports = {
  createTransaction: async (params: {
    transaction_details: { order_id: string; gross_amount: number };
    customer_details?: { first_name?: string; email?: string; phone?: string };
  }) => {
    return getMidtransSnap().createTransaction(params);
  },
};
