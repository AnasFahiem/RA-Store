import nodemailer from 'nodemailer';
import { formatCurrency } from './utils/format';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOrderEmail({ order, items, adminEmails }: { order: any; items: any[], adminEmails?: string[] }) {
    const defaultAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'ragym7780@gmail.com';
    const recipients = adminEmails && adminEmails.length > 0 ? adminEmails : [defaultAdminEmail];

    // Extract customer details from shipping_address (JSONB) or root (legacy/fallback)
    let shippingAddress = order.shipping_address;

    // Parse JSON string if necessary
    if (typeof shippingAddress === 'string') {
        try {
            shippingAddress = JSON.parse(shippingAddress);
        } catch (e) {
            console.error('Failed to parse shipping_address JSON:', e);
            shippingAddress = {};
        }
    }

    const customerName = shippingAddress?.name || order.customer_name || 'Guest';
    const customerEmail = shippingAddress?.email || order.customer_email || 'No Email';
    const customerPhone = shippingAddress?.phone || order.customer_phone || 'No Phone';

    console.log('SendOrderEmail Debug:', {
        orderId: order.id,
        customerName,
        customerEmail,
        hasShippingAddress: !!order.shipping_address,
        shippingAddressType: typeof order.shipping_address
    });

    // Address format
    let addressString = 'N/A';
    if (shippingAddress) {
        const { street, city } = shippingAddress;
        if (street || city) {
            addressString = `${street || ''}, ${city || ''}`;
        } else if (typeof order.shipping_address === 'string') {
            // Fallback to raw string if parsing failed but it was a string
            addressString = order.shipping_address;
        }
    }

    const itemsHtml = items.map(i => `
    <tr style="border-bottom: 1px solid #333;">
        <td style="padding: 12px; color: #e5e5e5;">${i.name} <span style="color: #888;">${i.variant ? `(${i.variant})` : ''}</span></td>
        <td style="padding: 12px; color: #e5e5e5; text-align: center;">${i.quantity}</td>
        <td style="padding: 12px; color: #e5e5e5; text-align: right;">${formatCurrency(i.price)}</td>
    </tr>
  `).join('');

    const emailTemplate = (title: string, message: string) => `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #111; padding: 20px; border-radius: 8px; border: 1px solid #333; }
            .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #facc15; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
            .details { background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
            .details p { margin: 5px 0; color: #ccc; }
            .details strong { color: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 10px; border-bottom: 1px solid #444; color: #888; text-transform: uppercase; font-size: 0.85em; }
            .total { text-align: right; margin-top: 20px; font-size: 1.25em; border-top: 1px solid #333; padding-top: 10px; color: #facc15; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #666; }
        </style>
    </head>
    <body style="background-color: #000; color: #fff;">
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <p style="color: #888; font-size: 0.9em;">Order #${order.id.slice(0, 8)}</p>
            </div>
            
            <p style="color: #ddd; line-height: 1.6;">${message}</p>

            <div class="details">
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <p><strong>Address:</strong> ${addressString}</p>
            </div>

            <table border="0" cellpadding="0" cellspacing="0">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="total">
                <strong>Total: ${formatCurrency(order.total_amount)}</strong>
            </div>

            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} RA Store. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // 1. Send to Admin (Notification)
    // 1. Send to Admin (Notification)
    try {
        await transporter.sendMail({
            from: `"RA Store" <${process.env.SMTP_USER}>`,
            to: recipients, // Nodemailer supports array of strings
            subject: `[New Order] #${order.id.slice(0, 8)} from ${customerName}`,
            html: emailTemplate('New Order Received', `A new order has been placed by <strong>${customerName}</strong>.`),
        });
        console.log(`Admin email sent to ${recipients.join(', ')}`);
    } catch (e) {
        console.error('Failed to send admin email:', e);
    }

    // 2. Send to Customer (Confirmation)
    if (customerEmail && customerEmail !== 'No Email') {
        try {
            await transporter.sendMail({
                from: `"RA Store" <${process.env.SMTP_USER}>`,
                to: customerEmail,
                subject: `Order Confirmation #${order.id.slice(0, 8)} - RA Store`,
                html: emailTemplate('Thank You!', `Hi ${customerName},<br>We've received your order and are finding the best gear for you.`),
            });
            console.log(`Customer email sent to ${customerEmail}`);
        } catch (e) {
            console.error('Failed to send customer email:', e);
        }
    }
}

export async function sendStatusUpdateEmail({ order, newStatus }: { order: any; newStatus: string }) {
    // Extract customer details (similar to sendOrderEmail)
    const customerName = order.shipping_address?.name || order.customer_name || 'Guest';
    const customerEmail = order.shipping_address?.email || order.customer_email || 'No Email';

    // Determine content based on status
    let title = 'Order Update';
    let message = '';

    switch (newStatus.toLowerCase()) {
        case 'processing':
            title = 'Order Processing';
            message = `Hi ${customerName},<br>Your order is now being processed. We are getting your gear ready!`;
            break;
        case 'shipped':
            title = 'Order Shipped';
            message = `Hi ${customerName},<br>Great news! Your order has been shipped and is on its way.`;
            break;
        case 'delivered':
            title = 'Order Delivered';
            message = `Hi ${customerName},<br>Your order has been delivered. We hope you enjoy your purchase!`;
            break;
        case 'cancelled':
            title = 'Order Cancelled';
            message = `Hi ${customerName},<br>Your order has been cancelled. If you have any questions, please contact support.`;
            break;
        default:
            title = 'Order Status Update';
            message = `Hi ${customerName},<br>Your order status has been updated to: <strong>${newStatus}</strong>.`;
    }

    const emailTemplate = (title: string, message: string) => `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #111; padding: 20px; border-radius: 8px; border: 1px solid #333; }
            .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #facc15; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
            .details { background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
            .details p { margin: 5px 0; color: #ccc; }
            .details strong { color: #fff; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #666; }
            .btn { display: inline-block; background-color: #facc15; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body style="background-color: #000; color: #fff;">
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <p style="color: #888; font-size: 0.9em;">Order #${order.id.slice(0, 8)}</p>
            </div>
            
            <p style="color: #ddd; line-height: 1.6;">${message}</p>

            <div class="details">
                <p><strong>Status:</strong> <span style="color: #facc15; text-transform: uppercase;">${newStatus}</span></p>
                <p><strong>Total:</strong> ${formatCurrency(order.total_amount)}</p>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://ra-store.com'}/account/orders" class="btn">View Order</a>
            </div>

            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} RA Store. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    if (customerEmail && customerEmail !== 'No Email') {
        try {
            await transporter.sendMail({
                from: `"RA Store" <${process.env.SMTP_USER}>`,
                to: customerEmail,
                subject: `${title} - Order #${order.id.slice(0, 8)}`,
                html: emailTemplate(title, message),
            });
            console.log(`Status update email sent to ${customerEmail}`);
        } catch (e) {
            console.error('Failed to send status update email:', e);
        }
    }
}
