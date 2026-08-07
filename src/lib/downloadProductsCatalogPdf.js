/**

 * Download full product catalog as A4 PDF (admin).

 * Filled: #, Product name, Qty — manual/empty: Actual rate, Selling rate, Rate, Weight

 * Products are grouped under bold category headings when categoryName is present.

 */

import { siteName } from '../utils/seo';



/**

 * @param {Array<{ name: string, quantity: number, categoryId?: string, categoryName?: string }>} products

 * @param {{ title?: string, subtitle?: string, categoryOrder?: Array<{ id: string, name: string }> }} [opts]

 */

export async function downloadProductsCatalogPdf(products, opts = {}) {

  const rows = Array.isArray(products) ? products : [];

  if (!rows.length) return;



  const [{ jsPDF }, autoTableMod] = await Promise.all([

    import('jspdf'),

    import('jspdf-autotable')

  ]);

  const autoTable = autoTableMod.default;



  const doc = new jsPDF({

    orientation: 'portrait',

    unit: 'mm',

    format: 'a4'

  });



  const pageW = doc.internal.pageSize.getWidth();

  const pageH = doc.internal.pageSize.getHeight();

  const margin = 14;

  let y = margin;



  doc.setFont('helvetica', 'bold');

  doc.setFontSize(16);

  doc.setTextColor(17, 24, 39);

  doc.text(opts.title || `${siteName} — Product Catalog`, margin, y);



  doc.setFont('helvetica', 'normal');

  doc.setFontSize(9);

  doc.setTextColor(75, 85, 99);

  const subtitle =

    opts.subtitle ||

    `Generated ${new Date().toLocaleString('en-PK')} · ${rows.length} product(s) · A4`;

  doc.text(subtitle, margin, y + 6);



  y += 14;

  doc.setDrawColor(229, 231, 235);

  doc.setLineWidth(0.3);

  doc.line(margin, y, pageW - margin, y);

  y += 6;



  const emptyManual = { minCellHeight: 9, halign: 'center' };

  const tableHead = [['#', 'Product name', 'Qty', 'Actual rate', 'Selling rate', 'Rate', 'Weight']];

  const tableStyles = {

    fontSize: 7.5,

    cellPadding: 2.2,

    textColor: [31, 41, 55],

    lineColor: [209, 213, 219],

    lineWidth: 0.15,

    overflow: 'linebreak',

    minCellHeight: 7

  };

  const headStyles = {

    fillColor: [234, 88, 12],

    textColor: [255, 255, 255],

    fontStyle: 'bold',

    fontSize: 8

  };

  const columnStyles = {

    0: { cellWidth: 7, halign: 'center' },

    1: { cellWidth: 'auto' },

    2: { cellWidth: 10, halign: 'center' },

    3: { cellWidth: 22, ...emptyManual },

    4: { cellWidth: 22, ...emptyManual },

    5: { cellWidth: 20, ...emptyManual },

    6: { cellWidth: 20, ...emptyManual }

  };



  const drawPageFooter = () => {

    const pageCount = doc.internal.getNumberOfPages();

    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;

    doc.setFont('helvetica', 'normal');

    doc.setFontSize(8);

    doc.setTextColor(107, 114, 128);

    doc.text(`Page ${pageNum} of ${pageCount}`, pageW / 2, pageH - 8, { align: 'center' });

  };



  const hasCategories = rows.some((p) => p.categoryName || p.categoryId);



  function buildCategoryGroups() {

    const groups = new Map();

    for (const p of rows) {

      const id = p.categoryId || p.categoryName || 'uncategorized';

      const name = p.categoryName || 'Uncategorized';

      if (!groups.has(id)) groups.set(id, { id, name, products: [] });

      groups.get(id).products.push(p);

    }



    const order = opts.categoryOrder;

    if (Array.isArray(order) && order.length) {

      const ordered = [];

      const seen = new Set();

      for (const cat of order) {

        const key = cat.id || cat.name;

        const group = groups.get(key);

        if (group?.products.length) {

          ordered.push(group);

          seen.add(group.id);

        }

      }

      for (const group of groups.values()) {

        if (!seen.has(group.id)) ordered.push(group);

      }

      return ordered;

    }



    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));

  }



  let rowNum = 0;



  const renderTable = (items, startY) => {

    const tableBody = items.map((p) => {

      rowNum += 1;

      return [

        String(rowNum),

        String(p.name || '—'),

        String(Number(p.quantity) || 0),

        '',

        '',

        '',

        ''

      ];

    });



    autoTable(doc, {

      startY,

      head: tableHead,

      body: tableBody,

      margin: { left: margin, right: margin, top: margin, bottom: 16 },

      styles: tableStyles,

      headStyles,

      alternateRowStyles: { fillColor: [249, 250, 251] },

      columnStyles,

      didDrawPage: drawPageFooter

    });



    return doc.lastAutoTable.finalY + 8;

  };



  if (hasCategories) {

    const groups = buildCategoryGroups();

    for (const group of groups) {

      if (y > pageH - 40) {

        doc.addPage();

        y = margin;

      }



      doc.setFont('helvetica', 'bold');

      doc.setFontSize(11);

      doc.setTextColor(17, 24, 39);

      doc.text(group.name, margin, y);

      y += 5;



      y = renderTable(group.products, y);

    }

  } else {

    y = renderTable(rows, y);

  }



  const filename = `products-catalog-${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);

}


