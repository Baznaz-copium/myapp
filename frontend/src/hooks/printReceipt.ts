export interface ReceiptItem {
  id: number;
  name: string;
  sell_price: number;
  _qty?: number;
  _price?: number;
}

export function printReceipt(items: ReceiptItem[], shopName = "Baznaz Shop", saleId?: number | string) {
  const now = new Date();
  const dateStr = now.toLocaleString();
  const fileDate = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const html = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 20px; background: #fff; color: #222; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .items { margin: 20px 0; }
          .items th, .items td { padding: 4px 8px; }
          .items th { border-bottom: 1px solid #222; }
          .total { font-size: 1.2em; font-weight: bold; margin-top: 10px; }
          .footer { margin-top: 30px; font-size: 0.9em; color: #555; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:1.3em;">${shopName}</div>
        <div class="center">${dateStr}</div>
        ${saleId ? `<div class="center">Sale #${saleId}</div>` : ''}
        <hr>
        <table class="items" width="100%">
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Price</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const price = Number(item._price ?? item.sell_price);
              const qty = Number(item._qty || 1);
              return `<tr>
                <td>${item.name}</td>
                <td align="center">${qty}</td>
                <td align="right">${price.toFixed(2)}</td>
                <td align="right">${(qty * price).toFixed(2)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <hr>
        <div class="total center">
          TOTAL: ${items.reduce((sum, item) => {
            const price = Number(item._price ?? item.sell_price);
            const qty = Number(item._qty || 1);
            return sum + qty * price;
          }, 0).toFixed(2)} DA
        </div>
        <div class="footer center">
          Thank you for your purchase!<br>
          No returns without receipt.
        </div>
      </body>
    </html>
  `;

  // Open new window and print
  const win = window.open('', '', 'width=400,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();

  // Wait for content to render, then print and save as PDF
  win.onload = () => {
      win.document.title = `${fileDate}.pdf`;
      win.print();
      // Try to trigger download as PDF (user must select "Save as PDF" in print dialog)
    };
}