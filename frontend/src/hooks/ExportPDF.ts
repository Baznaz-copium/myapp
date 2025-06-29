import html2pdf from 'html2pdf.js';

export function handleExportPDF(element: HTMLElement, filename = 'export.pdf') {
  if (!element) return;
  const opt = {
    margin:       [10, 10, 10, 10], // top, left, bottom, right
    filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } // avoid half-content at page end
  };
  html2pdf().set(opt).from(element).save();
}