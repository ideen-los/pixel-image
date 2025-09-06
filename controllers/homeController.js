import Order from '../models/Order.js';
import { setDefaultOptions, formatDistance } from 'date-fns';
import { de } from 'date-fns/locale';

setDefaultOptions({ locale: de });

export const displayOrdersFromDatabase = async function (req, res) {
  try {
    const orders = await Order.findAll({
      attributes: ['name', 'amount', 'updatedAt'],
      where: {
        status: 'completed', // Fetch only orders with the status 'completed'
      },
      order: [['updatedAt', 'DESC']],
      raw: true,
    });

    // Get the number of completed orders
    const numberOfOrders = await Order.count({
      where: {
        status: 'completed',
      },
    });

    // Get the sum of all orders
    // equals the number of pixels to reveal
    const totalDonations = await Order.sum('amount', {
      where: {
        status: 'completed',
      },
    });

    // Check if donated amount is available or above 100.000
    let cappedPixelsToReveal;
    if (!totalDonations) {
      cappedPixelsToReveal = 0;
    } else if (totalDonations > 100000) {
      cappedPixelsToReveal = 100000;
    } else {
      cappedPixelsToReveal = totalDonations;
    }

    // Format name of the donor, date of the order and the amount
    const formattedOrders = orders.map((order) => {
      let formattedName;
      let formattedAmount;
      let relativeDate;

      // Add 1000 separator to the donation amount
      formattedAmount = order.amount.toLocaleString('de-DE');

      // Truncate the name of the donor
      if (order.name.length > 100) {
        let truncatedName = order.name.substring(0, 2);
        formattedName = truncatedName + '...';
      } else {
        formattedName = order.name;
      }

      // Format the date of the order
      let orderDate = new Date(order.updatedAt);
      let now = new Date();

      // Format the order date to show relative time
      relativeDate = formatDistance(orderDate, now, { addSuffix: true });

      return {
        ...order,
        formattedAmount,
        name: formattedName,
        relativeDate,
      };
    });

    return res.render('index', {
      totalDonations,
      cappedPixelsToReveal,
      numberOfOrders,
      orders: formattedOrders,
    });
  } catch (error) {
    console.log('Unable to load orders: ', error);
    return;
  }
};
