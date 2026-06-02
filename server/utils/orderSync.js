const crypto = require('crypto');
const Log = require('../models/Log');
const Order = require('../models/Order');

async function syncOrdersFromLogs() {
  try {
    // Find logs that indicate completed payment
    const logs = await Log.find({
      action: { $regex: /Completed (mock )?payment of order:/ }
    });

    for (const log of logs) {
      const actionText = log.action;
      let orderId = '';
      let paymentId = '';

      if (actionText.includes('Completed mock payment of order:')) {
        orderId = actionText.replace('Completed mock payment of order:', '').trim();
        paymentId = 'mock_pay_' + log._id.toString().substring(18);
      } else if (actionText.includes('Completed payment of order:')) {
        const parts = actionText.split(' (Payment ID: ');
        orderId = parts[0].replace('Completed payment of order:', '').trim();
        if (parts[1]) {
          paymentId = parts[1].replace(')', '').trim();
        }
      }

      if (orderId) {
        const exists = await Order.findOne({ razorpayOrderId: orderId });
        if (!exists) {
          // Find amount from creation log
          let amount = 698; // default
          const creationLog = await Log.findOne({
            userId: log.userId,
            action: { $regex: /Created payment order for .* \(Amount: \d+\)/ },
            timestamp: {
              $gte: new Date(log.timestamp.getTime() - 5 * 60 * 1000),
              $lte: log.timestamp
            }
          });
          if (creationLog) {
            const amtMatch = creationLog.action.match(/\(Amount:\s*(\d+)\)/);
            if (amtMatch && amtMatch[1]) {
              amount = Number(amtMatch[1]);
            }
          }

          await new Order({
            userId: log.userId,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId || 'unknown_payment',
            items: [
              { id: 999, name: 'Agricultural Supplies Package', category: 'General', price: amount, qty: 1 }
            ],
            totalAmount: amount,
            shippingDetails: {
              fullName: 'Restored Customer',
              phone: 'N/A',
              address: 'Restored from Activity Log'
            },
            status: 'Processing',
            createdAt: log.timestamp || new Date()
          }).save();
          console.log(`Self-healing: Created order ${orderId} from log ${log._id}`);
        }
      }
    }
  } catch (err) {
    console.error('Error in self-healing syncOrdersFromLogs:', err);
  }
}

module.exports = { syncOrdersFromLogs };
