import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOrderEmail({ order, items }: { order: any; items: any[] }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    const itemsHtml = items.map(i => `
    <tr>
        <td>${i.name} ${i.variant ? `(${i.variant})` : ''}</td>
        <td>${i.quantity}</td>
        <td>$${i.price}</td>
    </tr>
  `).join('');

    const html = `
    <h1>New Order #${order.id}</h1>
    <p><strong>Customer:</strong> ${order.customer_name}</p>
    <p><strong>Email:</strong> ${order.customer_email}</p>
    <p><strong>Phone:</strong> ${order.customer_phone}</p>
    <p><strong>Address:</strong> ${order.shipping_address}</p>
    
    <h2>Items</h2>
    <table border="1" cellpadding="5" cellspacing="0">
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
        </tbody>
    </table>
    
    <h3>Total: $${order.total_amount}</h3>
  `;

    // Send to Admin
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: adminEmail,
        subject: `New Order #${order.id} from ${order.customer_name}`,
        html,
    });

    // Send to User
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: order.customer_email,
        subject: `Order Confirmation #${order.id} - RA Store`,
        html: `
        <h1>Thank you for your order!</h1>
        <p>We have received your order and are processing it.</p>
        ${html}
    `,
    });
}
