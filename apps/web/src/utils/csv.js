// Reusable CSV generation & download helpers
// Features:
//  - Proper RFC4180 escaping (double quotes, wrap fields with commas, newlines or quotes)
//  - Optional BOM for Excel compatibility
//  - Accepts array-of-arrays or array-of-objects (keys define header order)
//  - Small size, tree-shake friendly

function escapeField(v){
  if(v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}

export function buildRowsFromObjects(objs, headerOrder){
  if(!objs.length) return { headers: headerOrder || [], rows: [] };
  const headers = headerOrder && headerOrder.length ? headerOrder : Object.keys(objs[0]);
  const rows = objs.map(o => headers.map(h => o[h]));
  return { headers, rows };
}

export function generateCSV({ headers, rows, bom=false }){
  if(!Array.isArray(headers) || !Array.isArray(rows)) throw new Error('headers and rows must be arrays');
  const lines = [ headers.map(escapeField).join(',') , ...rows.map(r => r.map(escapeField).join(',')) ];
  const content = lines.join('\n');
  return bom ? '\uFEFF' + content : content; // Add BOM if requested
}

export function downloadCSV(csvString, filename='export.csv'){
  try {
    const blob = new Blob([csvString], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  } catch(err){
    console.error('CSV download failed', err);
    throw err;
  }
}

// Convenience: objects -> csv + download
export function exportObjectsAsCSV(objs, { headerOrder, filename='export.csv', bom=false }={}){
  const { headers, rows } = buildRowsFromObjects(objs, headerOrder);
  const csv = generateCSV({ headers, rows, bom });
  downloadCSV(csv, filename);
}

// Convenience: array rows export
export function exportRowsAsCSV(headers, rows, { filename='export.csv', bom=false }={}){
  const csv = generateCSV({ headers, rows, bom });
  downloadCSV(csv, filename);
}
