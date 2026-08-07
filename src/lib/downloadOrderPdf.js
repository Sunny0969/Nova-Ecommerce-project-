/**
 * Generate and download an A3 (297 × 420 mm) order PDF for admin/fulfillment.
 */
import { siteName } from '../utils/seo';
function orderRef(order) {
  const id = order?._id ? String(order._id) : '';
  if (!id) return '—';
  return id.length <= 8 ? id.toUpperCase() : id.slice(-8).toUpperCase();
}

function fullOrderRef(order) {
  return order?._id ? String(order._id) : '—';
}

function customerFromOrder(order) {
  const u = order?.user;
  const name = typeof u === 'object' && u != null ? u.name || '' : '';
  const email = typeof u === 'object' && u != null ? u.email || '' : '';
  const addr = order?.shippingAddress || {};
  return {
    name: name || [addr.firstName, addr.lastName].filter(Boolean).join(' ') || '—',
    email: email || addr.email || '—',
    phone: addr.phone || '—'
  };
}

function shippingLines(order) {
  const addr = order?.shippingAddress || {};
  const lines = [
    [addr.firstName, addr.lastName].filter(Boolean).join(' ') || customerFromOrder(order).name,
    addr.street,
    [addr.city, addr.state, addr.zipCode].filter(Boolean).join(', '),
    addr.country,
    addr.phone ? `Tel: ${addr.phone}` : ''
  ].filter(Boolean);
  return lines.length ? lines : ['—'];
}

function money(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs ${abs}`;
}

/** Discount / wallet — ASCII minus only (Unicode − renders as " in jsPDF Helvetica). */
function moneyDeduction(n) {
  return `- ${money(n)}`;
}

/**
 * @param {object} order — populated admin order document
 */
export async function downloadOrderPdf(order) {
  if (!order) return;

  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3'
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;
  const customer = customerFromOrder(order);
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const placed = order.createdAt ? new Date(order.createdAt).toLocaleString('en-PK') : '—';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text(siteName, margin, y);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Order invoice / packing slip', pageW - margin, y, { align: 'right' });
  y += 10;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`Order #${orderRef(order)}`, margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  const meta = [
    `Order ID: ${fullOrderRef(order)}`,
    `Placed: ${placed}`,
    `Status: ${String(order.status || 'pending').toUpperCase()}`,
    `Delivery: ${order.deliveryOption || 'standard'}`,
    order.trackingNumber ? `Tracking: ${order.trackingNumber}` : null
  ].filter(Boolean);

  meta.forEach((line) => {
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 4;

  const colMid = pageW / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Customer', margin, y);
  doc.text('Ship to', colMid, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const customerLines = [customer.name, customer.email, customer.phone !== '—' ? `Tel: ${customer.phone}` : null].filter(
    Boolean
  );
  const shipLines = shippingLines(order);
  const blockRows = Math.max(customerLines.length, shipLines.length);

  for (let i = 0; i < blockRows; i += 1) {
    if (customerLines[i]) doc.text(String(customerLines[i]), margin, y);
    if (shipLines[i]) doc.text(String(shipLines[i]), colMid, y);
    y += 5.5;
  }
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Payment', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const paidLabel = order.isPaid ? 'Paid' : 'Unpaid';
  doc.text(`Method: ${order.paymentMethod || '—'}  |  ${paidLabel}`, margin, y);
  if (order.paidAt) {
    y += 5.5;
    doc.text(`Paid at: ${new Date(order.paidAt).toLocaleString('en-PK')}`, margin, y);
  }
  y += 10;

  const tableBody = items.map((line, idx) => {
    const qty = Number(line.quantity) || 1;
    const price = Number(line.price) || 0;
    return [
      String(idx + 1),
      String(line.name || '—'),
      String(qty),
      money(price),
      money(price * qty)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Product', 'Qty', 'Unit price', 'Line total']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [31, 41, 55],
      lineColor: [209, 213, 219],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 10;
  const totalsX = pageW - margin - 70;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const totalRows = [
    ['Subtotal', money(order.itemsPrice)],
    Number(order.discountAmount) > 0 ? ['Discount', moneyDeduction(order.discountAmount)] : null,
    ['Shipping', money(order.shippingPrice)],
    Number(order.taxPrice) > 0 ? ['Tax', money(order.taxPrice)] : null,
    Number(order.walletAmountUsed) > 0 ? ['Wallet used', moneyDeduction(order.walletAmountUsed)] : null
  ].filter(Boolean);

  totalRows.forEach(([label, val]) => {
    doc.text(String(label), totalsX, y);
    doc.text(String(val), pageW - margin, y, { align: 'right' });
    y += 6;
  });

  doc.setDrawColor(17, 24, 39);
  doc.line(totalsX, y, pageW - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', totalsX, y);
  doc.text(money(order.totalPrice), pageW - margin, y, { align: 'right' });
  y += 12;

  if (order.notes && String(order.notes).trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Order notes', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(String(order.notes).trim(), pageW - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5 + 4;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Generated ${new Date().toLocaleString('en-PK')} · ${siteName} · A3 (297 × 420 mm)`,
    margin,
    doc.internal.pageSize.getHeight() - 12
  );

  const filename = `order-${orderRef(order)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
