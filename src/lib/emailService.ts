import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Order } from '../types';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  emailHtml: string;
  emailSubject: string;
}

export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG').format(amount);
}

/**
 * Generate a clean, responsive, branded HTML email template for an order
 */
export function generateOrderConfirmationEmailHtml(order: Order): string {
  const itemsHtml = order.items
    .map((item) => {
      const unitPrice = item.unitPrice ?? item.price;
      const total = item.totalPrice ?? (unitPrice * item.quantity);
      const varInfo = item.variationName
        ? `<div style="font-size:12px;color:#ea580c;font-weight:600;margin-top:2px;">Variation: ${escapeHtml(item.variationName)}</div>`
        : item.selectedSize
        ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">Size: ${escapeHtml(item.selectedSize)}</div>`
        : '';

      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 8px;vertical-align:top;">
            <strong style="color:#111827;font-size:14px;">${escapeHtml(item.title)}</strong>
            ${varInfo}
          </td>
          <td style="padding:12px 8px;text-align:center;color:#374151;font-size:14px;vertical-align:top;">
            ${item.quantity}
          </td>
          <td style="padding:12px 8px;text-align:right;color:#374151;font-size:14px;vertical-align:top;font-family:monospace;">
            UGX ${formatUGX(unitPrice)}
          </td>
          <td style="padding:12px 8px;text-align:right;color:#111827;font-weight:700;font-size:14px;vertical-align:top;font-family:monospace;">
            UGX ${formatUGX(total)}
          </td>
        </tr>
      `;
    })
    .join('');

  const paymentMethodLabel =
    order.paymentMethod === 'Shop' || order.paymentMethod === 'COD'
      ? 'Payment at the Shop'
      : order.paymentMethod === 'Mobile Money'
      ? 'Payment using Mobile Money (0774 540199)'
      : order.paymentMethod;

  const paymentInstructionsHtml =
    order.paymentMethod === 'Mobile Money'
      ? `
        <div style="background-color:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px;margin-top:16px;">
          <strong style="color:#92400e;font-size:14px;display:block;margin-bottom:6px;">
            📱 Mobile Money Transfer Instructions
          </strong>
          <p style="margin:0 0 6px 0;color:#78350f;font-size:13px;line-height:1.5;">
            Please send the total amount of <strong style="color:#111827;">UGX ${formatUGX(order.totalAmount)}</strong> to our official Mobile Money line:
          </p>
          <div style="background:#ffffff;border:2px dashed #f59e0b;border-radius:6px;padding:10px 14px;text-align:center;font-size:18px;font-weight:800;color:#b45309;font-family:monospace;letter-spacing:1px;margin-bottom:8px;">
            0774 540199
          </div>
          <p style="margin:0;font-size:12px;color:#92400e;">
            Recipient Name: <strong>UK2UG Import Logistics / Joel Kakooza</strong>. Please quote your Order ID <strong>${escapeHtml(order.id)}</strong> as reference.
          </p>
        </div>
      `
      : `
        <div style="background-color:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:14px;margin-top:16px;">
          <strong style="color:#065f46;font-size:14px;display:block;margin-bottom:4px;">
            🏬 Payment at the Shop
          </strong>
          <p style="margin:0;color:#047857;font-size:13px;line-height:1.5;">
            You can pay at our Kampala retail shop counter upon collecting your package. We accept physical Cash (UGX), Mobile Money, and Visa/Mastercard at the counter.
          </p>
        </div>
      `;

  const deliverySection =
    order.deliveryPath === 'pickup'
      ? `
        <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-top:12px;">
          <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Pickup Location</div>
          <div style="font-size:14px;font-weight:700;color:#111827;margin-top:2px;">UK2UG Kampala Central Collection Hub</div>
          <div style="font-size:12px;color:#4b5563;margin-top:2px;">Plot 14 Kampala Road, Commercial Plaza, Ground Floor Shop G-08, Kampala, Uganda</div>
          <div style="font-size:12px;color:#ea580c;font-weight:600;margin-top:4px;">Mon - Sat: 9:00 AM - 7:00 PM | Contact: 0774 540199</div>
        </div>
      `
      : `
        <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-top:12px;">
          <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Doorstep Delivery Destination</div>
          <div style="font-size:14px;font-weight:700;color:#111827;margin-top:2px;">${escapeHtml(order.deliveryDetails?.district || 'Kampala')} - ${escapeHtml(order.deliveryDetails?.area || '')}</div>
          <div style="font-size:12px;color:#4b5563;margin-top:2px;">Landmark: ${escapeHtml(order.deliveryDetails?.landmark || 'N/A')}</div>
          ${order.deliveryDetails?.notes ? `<div style="font-size:12px;color:#6b7280;font-style:italic;margin-top:2px;">Notes: ${escapeHtml(order.deliveryDetails.notes)}</div>` : ''}
        </div>
      `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>UK2UG Order Confirmation #${escapeHtml(order.id)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:24px 12px;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">
    
    <!-- Top Branding Banner -->
    <div style="background:linear-gradient(135deg, #ea580c 0%, #c2410c 100%);padding:28px 24px;color:#ffffff;text-align:center;">
      <div style="font-size:22px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">UK2UG IMPORT LOGISTICS</div>
      <div style="font-size:12px;opacity:0.9;margin-top:4px;letter-spacing:0.5px;">Direct London to Kampala Genuine Retail Gateway</div>
      <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-top:14px;border:1px solid rgba(255,255,255,0.25);">
        Order Confirmation & Receipt Copy
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding:24px;">
      
      <!-- Greeting & Overview -->
      <div style="margin-bottom:20px;">
        <h2 style="margin:0 0 6px 0;color:#111827;font-size:18px;">Hello ${escapeHtml(order.customerName)},</h2>
        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.5;">
          Thank you for your order with <strong>UK2UG</strong>! We have received your order details and your items are being prepared for dispatch. Below is your official copy.
        </p>
      </div>

      <!-- Order Metadata Bar -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <span style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;display:block;">Order ID</span>
          <span style="font-size:15px;font-weight:800;color:#ea580c;font-family:monospace;">${escapeHtml(order.id)}</span>
        </div>
        <div>
          <span style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;display:block;">Date</span>
          <span style="font-size:13px;color:#374151;">${new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>
          <span style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;display:block;">Security PIN</span>
          <span style="font-size:15px;font-weight:800;color:#b45309;font-family:monospace;background:#fef3c7;padding:1px 6px;border-radius:4px;">${escapeHtml(order.deliveryPin || 'N/A')}</span>
        </div>
      </div>

      <!-- Customer Contact Details -->
      <div style="margin-bottom:20px;font-size:13px;color:#4b5563;line-height:1.6;">
        <div><strong>Customer Name:</strong> ${escapeHtml(order.customerName)}</div>
        <div><strong>Customer Phone:</strong> ${escapeHtml(order.customerPhone)}</div>
        ${order.customerEmail ? `<div><strong>Customer Email:</strong> ${escapeHtml(order.customerEmail)}</div>` : ''}
        <div><strong>Payment Method:</strong> ${escapeHtml(paymentMethodLabel)}</div>
      </div>

      <!-- Delivery / Pickup Info -->
      ${deliverySection}

      <!-- Items Table -->
      <div style="margin-top:24px;">
        <h3 style="margin:0 0 10px 0;color:#111827;font-size:15px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ea580c;padding-bottom:6px;">
          Ordered Items
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <thead>
            <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;text-align:left;">
              <th style="padding:8px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;">Item & Variation</th>
              <th style="padding:8px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;text-align:center;">Qty</th>
              <th style="padding:8px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;text-align:right;">Price</th>
              <th style="padding:8px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:10px 8px;text-align:right;font-size:13px;color:#4b5563;">Subtotal:</td>
              <td style="padding:10px 8px;text-align:right;font-size:13px;font-weight:600;font-family:monospace;color:#111827;">UGX ${formatUGX(order.subtotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding:6px 8px;text-align:right;font-size:13px;color:#4b5563;">Delivery Fee:</td>
              <td style="padding:6px 8px;text-align:right;font-size:13px;font-weight:600;font-family:monospace;color:#111827;">${order.deliveryFee > 0 ? `UGX ${formatUGX(order.deliveryFee)}` : 'FREE'}</td>
            </tr>
            <tr style="border-top:2px solid #111827;">
              <td colspan="3" style="padding:12px 8px;text-align:right;font-size:16px;font-weight:800;color:#111827;">Grand Total:</td>
              <td style="padding:12px 8px;text-align:right;font-size:16px;font-weight:800;font-family:monospace;color:#ea580c;">UGX ${formatUGX(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Instructions -->
      ${paymentInstructionsHtml}

      <!-- Help / Support Footer -->
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;line-height:1.5;">
        <p style="margin:0 0 4px 0;">Need assistance or want to verify your delivery status?</p>
        <p style="margin:0;">
          Call / WhatsApp Support: <strong style="color:#ea580c;">0774 540199</strong> | Email: <strong style="color:#ea580c;">support@uk2ug.com</strong>
        </p>
        <p style="margin:8px 0 0 0;font-size:11px;color:#9ca3af;">
          UK2UG Retail Logistics Ltd &copy; 2026. All authentic UK imports guaranteed.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Dispatch or queue an order confirmation email to the customer
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<EmailDispatchResult> {
  const recipientEmail = order.customerEmail?.trim();
  const emailHtml = generateOrderConfirmationEmailHtml(order);
  const emailSubject = `Order Confirmation #${order.id} - UK2UG London to Kampala`;

  if (!recipientEmail) {
    return {
      success: false,
      error: 'No customer email provided',
      emailHtml,
      emailSubject,
    };
  }

  try {
    // 1. Write to standard Firebase Trigger Email collection ('mail')
    if (db) {
      await addDoc(collection(db, 'mail'), {
        to: recipientEmail,
        message: {
          subject: emailSubject,
          html: emailHtml,
          text: `Thank you for your order #${order.id} with UK2UG. Total amount: UGX ${formatUGX(order.totalAmount)}. Contact support at 0774 540199.`,
        },
        orderId: order.id,
        createdAt: new Date().toISOString(),
      });

      // 2. Also log in 'order_emails' collection for easy dashboard review
      await addDoc(collection(db, 'order_emails'), {
        orderId: order.id,
        recipientEmail,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        sentAt: new Date().toISOString(),
        status: 'queued_and_logged',
      });
    }

    return {
      success: true,
      emailHtml,
      emailSubject,
    };
  } catch (err: any) {
    console.warn('Firestore mail write note:', err?.message || err);
    // Still return the generated HTML so customer can preview, download, or send
    return {
      success: true,
      emailHtml,
      emailSubject,
      error: err?.message,
    };
  }
}
