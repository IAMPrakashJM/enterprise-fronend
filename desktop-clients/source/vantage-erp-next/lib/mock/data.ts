// @ts-nocheck — seeded mock data layer; replace with API handlers in production.
import type { ErpData } from '@/lib/types';
const rng = (seed) => { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const F = (key, label, type, o) => Object.assign({ key, label, type }, o || {});

  const FIRST = ['Aarav', 'Meera', 'Daniel', 'Sofia', 'Yusuf', 'Hannah', 'Kenji', 'Priya', 'Lucas', 'Amara', 'Omar', 'Elena', 'Ravi', 'Chloe', 'Tariq', 'Nadia', 'Felix', 'Ishaan', 'Layla', 'Mateo'];
  const LAST = ['Nair', 'Okafor', 'Schmidt', 'Haddad', 'Tanaka', 'Rossi', 'Iyer', 'Novak', 'Mensah', 'Khan', 'Silva', 'Brennan', 'Osei', 'Petrov', 'Rahman', 'Lindqvist', 'Moreau', 'Chen', 'Varga', 'Abebe'];
  const COMPANY = ['Halcyon Foods', 'Northgate Retail', 'Blue Harbor Logistics', 'Sable & Finch', 'Orion Pharma', 'Kestrel Motors', 'Verdant Agro', 'Cobalt Systems', 'Meridian Textiles', 'Aster Hospitality', 'Granite Build Co', 'Lumen Energy', 'Pinecrest Clinics', 'Tidewater Marine', 'Summit Edu Group', 'Ironwood Furniture', 'Saffron Spices Ltd', 'Quill Publishing', 'Delta Freight', 'Zephyr Airlines'];
  const CITY = ['Dubai', 'Chennai', 'Singapore', 'Riyadh', 'Mumbai', 'London', 'Doha', 'Bengaluru', 'Nairobi', 'Kuala Lumpur', 'Manama', 'Karachi'];
  const COUNTRY = ['UAE', 'India', 'Singapore', 'Saudi Arabia', 'UK', 'Qatar', 'Kenya', 'Malaysia', 'Bahrain', 'Pakistan'];
  const PRODUCT = ['Basmati Rice 25kg', 'Olive Oil 5L', 'Steel Rod 12mm', 'Copper Wire 2.5mm', 'LED Panel 40W', 'Cement 50kg', 'Printer Paper A4', 'Laptop 14"', 'Office Chair', 'Safety Helmet', 'Diesel Generator 20kVA', 'Water Pump 1HP', 'Ceramic Tile 60x60', 'PVC Pipe 4"', 'Cotton Fabric Roll', 'Sugar 50kg', 'Coffee Beans 1kg', 'Server Rack 42U', 'Network Switch 24p', 'Hand Sanitizer 5L'];
  const WORDS = ['Approved by regional manager.', 'Pending document verification.', 'Credit terms renegotiated in Q2.', 'Preferred supplier for the west region.', 'Escalated to compliance.', 'Standard terms apply.', 'Key account, quarterly review.', 'Migrated from legacy system.'];
  const STATUS = ['Active', 'Inactive', 'Pending', 'Blocked'];
  const BRANCHES = ['Dubai HQ', 'Chennai', 'Singapore', 'Riyadh'];

  function genValue(f, r, i) {
    const g = f.gen || f.type;
    switch (g) {
      case 'code': return (f.prefix || 'ID') + '-' + String(1001 + i).padStart(4, '0');
      case 'company': return pick(r, COMPANY) + (r() > 0.7 ? ' ' + pick(r, ['LLC', 'FZE', 'Pvt Ltd', 'Inc']) : '');
      case 'person': return pick(r, FIRST) + ' ' + pick(r, LAST);
      case 'city': return pick(r, CITY);
      case 'country': return pick(r, COUNTRY);
      case 'address': return Math.floor(r() * 900 + 10) + ' ' + pick(r, ['Sheikh Zayed Rd', 'Anna Salai', 'Orchard Rd', 'King Fahd Rd', 'MG Road', 'Harbour St']);
      case 'email': return pick(r, FIRST).toLowerCase() + '.' + pick(r, LAST).toLowerCase() + '@' + pick(r, ['halcyon.com', 'mail.com', 'corp.io', 'biz.net']);
      case 'phone': return '+' + pick(r, ['971', '91', '65', '966']) + ' ' + Math.floor(r() * 900000000 + 100000000);
      case 'product': return pick(r, PRODUCT);
      case 'textarea': return pick(r, WORDS);
      case 'number': return Math.round((f.min || 0) + r() * ((f.max || 1000) - (f.min || 0)));
      case 'currency': return Math.round(((f.min || 100) + r() * ((f.max || 250000) - (f.min || 100))) * 100) / 100;
      case 'percent': return pick(r, [0, 5, 10, 12, 15, 18]);
      case 'date': { const d = new Date(2026, Math.floor(r() * 9), Math.floor(r() * 28) + 1); return d.toISOString().slice(0, 10); }
      case 'select': return pick(r, f.options || STATUS);
      case 'multiselect': { const o = f.options || STATUS; const n = 1 + Math.floor(r() * 3); const s = new Set(); for (let k = 0; k < n; k++) s.add(pick(r, o)); return Array.from(s); }
      case 'toggle': return r() > 0.35;
      case 'branch': return pick(r, BRANCHES);
      default: return pick(r, FIRST) + ' ' + pick(r, LAST);
    }
  }

  const E = {};
  let seed = 11;
  function ent(id, label, plural, module, sections, o) {
    o = o || {};
    const fields = sections.flatMap(s => s.fields);
    const r = rng(seed++ * 7919);
    const n = o.count || 57;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const row = { _id: id + '-' + (i + 1) };
      fields.forEach(f => { row[f.key] = genValue(f, r, i); });
      rows.push(row);
    }
    E[id] = { id, label, plural, module, sections, fields, rows, titleKey: o.titleKey || fields[1].key, quickActions: o.actions || [{ label: 'View', act: 'view' }, { label: 'Edit', act: 'edit' }] };
  }

  const audit = { title: 'Audit & Notes', fields: [F('branch', 'Branch', 'select', { options: BRANCHES, gen: 'branch', basic: true, col: true }), F('status', 'Status', 'select', { options: STATUS, basic: true, col: true }), F('created', 'Created on', 'date', { adv: true }), F('owner', 'Record owner', 'text', { gen: 'person', adv: true }), F('notes', 'Notes', 'textarea')] };

  // ---------------- SALES & BILLING ----------------
  ent('customer', 'Customer', 'Customers', 'sales', [
    { title: 'General', fields: [F('code', 'Customer code', 'code', { prefix: 'CUS', col: true, req: true }), F('name', 'Customer name', 'text', { gen: 'company', col: true, req: true }), F('group', 'Customer group', 'select', { options: ['Retail', 'Wholesale', 'Distributor', 'Key Account'], basic: true, col: true }), F('segment', 'Segment', 'multiselect', { options: ['Food', 'Industrial', 'Healthcare', 'Government', 'Education'], adv: true }), F('taxId', 'Tax registration no.', 'text', { gen: 'code', prefix: 'TRN' }), F('currency', 'Currency', 'select', { options: ['AED', 'INR', 'USD', 'SGD', 'SAR'], adv: true })] },
    { title: 'Contact', fields: [F('contact', 'Primary contact', 'text', { gen: 'person', col: true }), F('email', 'Email', 'email'), F('phone', 'Phone', 'phone', { col: true }), F('city', 'City', 'text', { gen: 'city', col: true, basic: true }), F('country', 'Country', 'select', { options: COUNTRY, adv: true }), F('address', 'Billing address', 'textarea', { gen: 'address' })] },
    { title: 'Credit & Terms', fields: [F('creditLimit', 'Credit limit', 'currency', { col: true, min: 5000, max: 500000, adv: true }), F('terms', 'Payment terms', 'select', { options: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance'], adv: true }), F('priceList', 'Price list', 'select', { options: ['Standard', 'Wholesale', 'Contract A', 'Contract B'] }), F('taxable', 'Taxable', 'toggle'), F('onHold', 'Credit hold', 'toggle')] },
    audit
  ], { actions: [{ label: 'View', act: 'view' }, { label: 'Edit', act: 'edit' }, { label: 'New invoice', act: 'nav', page: 'billing' }, { label: 'Statement', act: 'toast', msg: 'Statement queued for email' }] });

  ent('customerGroup', 'Customer group', 'Customer groups', 'sales', [{ title: 'Group', fields: [F('code', 'Code', 'code', { prefix: 'CGR', col: true }), F('name', 'Group name', 'select', { options: ['Retail', 'Wholesale', 'Distributor', 'Key Account', 'Online', 'Export'], col: true }), F('discount', 'Default discount %', 'percent', { col: true }), F('priceList', 'Price list', 'select', { options: ['Standard', 'Wholesale', 'Contract A'], col: true })] }, audit], { count: 12 });

  ent('product', 'Product', 'Products', 'sales', [
    { title: 'Item', fields: [F('sku', 'SKU', 'code', { prefix: 'SKU', col: true, req: true }), F('name', 'Product name', 'text', { gen: 'product', col: true, req: true }), F('category', 'Category', 'select', { options: ['Food', 'Construction', 'Electrical', 'IT', 'Office', 'Safety'], basic: true, col: true }), F('uom', 'Unit of measure', 'select', { options: ['EA', 'KG', 'BOX', 'LTR', 'MTR'], col: true }), F('brand', 'Brand', 'select', { options: ['Generic', 'Halcyon', 'Apex', 'Nova', 'Titan'], adv: true })] },
    { title: 'Pricing & Tax', fields: [F('cost', 'Standard cost', 'currency', { min: 5, max: 5000 }), F('price', 'Selling price', 'currency', { col: true, min: 10, max: 8000 }), F('tax', 'Tax rate %', 'percent', { col: true }), F('hsn', 'HSN / Tariff code', 'text', { gen: 'code', prefix: 'HSN' }), F('tracked', 'Track inventory', 'toggle')] },
    { title: 'Stock', fields: [F('reorder', 'Reorder level', 'number', { min: 10, max: 500 }), F('onHand', 'On hand', 'number', { min: 0, max: 3000, col: true }), F('warehouses', 'Stocked in', 'multiselect', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub', 'Riyadh WH'] })] },
    audit
  ]);

  ent('priceList', 'Price list', 'Price lists', 'sales', [{ title: 'Price list', fields: [F('code', 'Code', 'code', { prefix: 'PL', col: true }), F('name', 'Name', 'select', { options: ['Standard', 'Wholesale', 'Contract A', 'Contract B', 'Promo Q3', 'Export'], col: true }), F('currency', 'Currency', 'select', { options: ['AED', 'INR', 'USD'], col: true }), F('validFrom', 'Valid from', 'date', { col: true }), F('validTo', 'Valid to', 'date', { col: true }), F('markup', 'Markup %', 'percent')] }, audit], { count: 9 });

  ent('quotation', 'Quotation', 'Quotations', 'sales', [
    { title: 'Quotation', fields: [F('no', 'Quote no.', 'code', { prefix: 'QT', col: true }), F('customer', 'Customer', 'text', { gen: 'company', col: true, req: true }), F('date', 'Quote date', 'date', { col: true, adv: true }), F('validity', 'Valid until', 'date'), F('salesperson', 'Salesperson', 'text', { gen: 'person', col: true, basic: true }), F('amount', 'Amount', 'currency', { col: true }), F('stage', 'Stage', 'select', { options: ['Draft', 'Sent', 'Negotiation', 'Won', 'Lost'], basic: true, col: true })] },
    { title: 'Terms', fields: [F('terms', 'Payment terms', 'select', { options: ['Net 30', 'Net 45', 'Advance'] }), F('delivery', 'Delivery terms', 'select', { options: ['Ex-works', 'FOB', 'CIF', 'DDP'] }), F('notes', 'Remarks', 'textarea')] }
  ], { actions: [{ label: 'View', act: 'view' }, { label: 'Edit', act: 'edit' }, { label: 'Convert to order', act: 'toast', msg: 'Sales order created from quotation' }] });

  ent('salesOrder', 'Sales order', 'Sales orders', 'sales', [
    { title: 'Order', fields: [F('no', 'Order no.', 'code', { prefix: 'SO', col: true }), F('customer', 'Customer', 'text', { gen: 'company', col: true }), F('date', 'Order date', 'date', { col: true, adv: true }), F('deliveryDate', 'Delivery date', 'date', { adv: true }), F('amount', 'Amount', 'currency', { col: true }), F('status', 'Status', 'select', { options: ['Open', 'Partially delivered', 'Delivered', 'Invoiced', 'Cancelled'], basic: true, col: true }), F('branch', 'Branch', 'select', { options: BRANCHES, gen: 'branch', basic: true, col: true })] },
    { title: 'Fulfilment', fields: [F('warehouse', 'Ship from', 'select', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub'] }), F('carrier', 'Carrier', 'select', { options: ['Delta Freight', 'Aramex', 'DHL', 'Own fleet'] }), F('priority', 'Priority', 'select', { options: ['Normal', 'High', 'Urgent'] }), F('notes', 'Remarks', 'textarea')] }
  ], { actions: [{ label: 'View', act: 'view' }, { label: 'Edit', act: 'edit' }, { label: 'Create invoice', act: 'nav', page: 'billing' }] });

  ent('invoice', 'Invoice', 'Billing worklist', 'sales', [
    { title: 'Invoice', fields: [F('no', 'Invoice no.', 'code', { prefix: 'INV', col: true }), F('customer', 'Customer', 'text', { gen: 'company', col: true }), F('date', 'Invoice date', 'date', { col: true, adv: true }), F('dueDate', 'Due date', 'date', { col: true, adv: true }), F('amount', 'Total', 'currency', { col: true }), F('balance', 'Balance due', 'currency', { col: true, min: 0, max: 50000 }), F('status', 'Status', 'select', { options: ['Draft', 'Posted', 'Partially paid', 'Paid', 'Overdue', 'Void'], basic: true, col: true }), F('branch', 'Branch', 'select', { options: BRANCHES, gen: 'branch', basic: true })] },
    { title: 'Tax', fields: [F('taxType', 'Tax type', 'select', { options: ['VAT 5%', 'GST 18%', 'Zero rated', 'Exempt'], adv: true }), F('taxAmount', 'Tax amount', 'currency', { min: 0, max: 5000 }), F('jurisdiction', 'Jurisdiction', 'select', { options: ['UAE', 'India-TN', 'Singapore', 'KSA'], adv: true })] }
  ], { actions: [{ label: 'Open bill', act: 'nav', page: 'billing' }, { label: 'View', act: 'view' }, { label: 'Print', act: 'toast', msg: 'Sent to printer: Tax invoice' }, { label: 'Record payment', act: 'toast', msg: 'Payment receipt opened' }] });

  ent('receipt', 'Receipt', 'Receipts', 'sales', [{ title: 'Receipt', fields: [F('no', 'Receipt no.', 'code', { prefix: 'RCP', col: true }), F('customer', 'Customer', 'text', { gen: 'company', col: true }), F('date', 'Date', 'date', { col: true, adv: true }), F('amount', 'Amount', 'currency', { col: true }), F('mode', 'Payment mode', 'select', { options: ['Bank transfer', 'Cheque', 'Cash', 'Card', 'LC'], basic: true, col: true }), F('reference', 'Reference', 'text', { gen: 'code', prefix: 'REF' }), F('bank', 'Bank account', 'select', { options: ['ENBD Current', 'HDFC Current', 'DBS Ops'] })] }, audit]);

  ent('tax', 'Tax code', 'Taxation master', 'sales', [{ title: 'Tax code', fields: [F('code', 'Tax code', 'code', { prefix: 'TX', col: true }), F('name', 'Description', 'select', { options: ['VAT Standard', 'VAT Zero', 'GST 18%', 'GST 12%', 'GST 5%', 'Exempt', 'Reverse charge'], col: true }), F('rate', 'Rate %', 'percent', { col: true }), F('type', 'Type', 'select', { options: ['Output', 'Input', 'Both'], basic: true, col: true }), F('jurisdiction', 'Jurisdiction', 'select', { options: ['UAE', 'India-TN', 'India-KA', 'Singapore', 'KSA'], basic: true, col: true }), F('glAccount', 'GL account', 'select', { options: ['2100 VAT Payable', '2110 GST Payable', '1400 Input Tax'] }), F('effective', 'Effective from', 'date')] }, audit], { count: 14 });

  ent('jurisdiction', 'Jurisdiction', 'Jurisdiction master', 'sales', [{ title: 'Jurisdiction', fields: [F('code', 'Code', 'code', { prefix: 'JUR', col: true }), F('name', 'Name', 'select', { options: ['UAE Federal', 'Tamil Nadu', 'Karnataka', 'Singapore', 'Saudi Arabia', 'Qatar', 'Bahrain'], col: true }), F('country', 'Country', 'select', { options: COUNTRY, basic: true, col: true }), F('authority', 'Tax authority', 'select', { options: ['FTA', 'CBIC', 'IRAS', 'ZATCA', 'GTA'], col: true }), F('filing', 'Filing frequency', 'select', { options: ['Monthly', 'Quarterly', 'Annually'], col: true }), F('eInvoicing', 'e-Invoicing mandatory', 'toggle')] }, audit], { count: 8 });

  ent('salesperson', 'Salesperson', 'Sales team', 'sales', [{ title: 'Salesperson', fields: [F('code', 'Code', 'code', { prefix: 'SP', col: true }), F('name', 'Name', 'text', { gen: 'person', col: true }), F('territory', 'Territory', 'select', { options: ['GCC', 'South India', 'ASEAN', 'East Africa'], basic: true, col: true }), F('target', 'Annual target', 'currency', { col: true, min: 100000, max: 2000000 }), F('achieved', 'Achieved YTD', 'currency', { col: true, min: 50000, max: 1500000 }), F('email', 'Email', 'email')] }, audit], { count: 18 });

  // ---------------- FINANCE ----------------
  ent('glAccount', 'GL account', 'Chart of accounts', 'finance', [{ title: 'Account', fields: [F('code', 'Account code', 'code', { prefix: '1', col: true }), F('name', 'Account name', 'select', { options: ['Cash', 'Bank - ENBD', 'Accounts receivable', 'Inventory', 'Fixed assets', 'Accounts payable', 'VAT payable', 'Share capital', 'Sales revenue', 'Cost of goods sold', 'Salaries', 'Rent', 'Depreciation'], col: true }), F('type', 'Account type', 'select', { options: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'], basic: true, col: true }), F('currency', 'Currency', 'select', { options: ['AED', 'INR', 'USD'], col: true }), F('balance', 'Balance', 'currency', { col: true, min: -200000, max: 900000 }), F('postable', 'Allow posting', 'toggle'), F('costCenterReq', 'Cost center required', 'toggle')] }, audit], { count: 40 });

  ent('journal', 'Journal entry', 'Journal entries', 'finance', [{ title: 'Journal', fields: [F('no', 'Journal no.', 'code', { prefix: 'JV', col: true }), F('date', 'Posting date', 'date', { col: true, adv: true }), F('type', 'Journal type', 'select', { options: ['General', 'Accrual', 'Reversal', 'Payroll', 'Depreciation'], basic: true, col: true }), F('description', 'Narration', 'textarea', { col: true }), F('debit', 'Debit', 'currency', { col: true }), F('period', 'Fiscal period', 'select', { options: ['2026-P01', '2026-P02', '2026-P03', '2026-P04', '2026-P05', '2026-P06'], adv: true }), F('status', 'Status', 'select', { options: ['Draft', 'Posted', 'Reversed'], basic: true, col: true })] }, { title: 'Audit & Notes', fields: [F('branch', 'Branch', 'select', { options: BRANCHES, gen: 'branch', basic: true }), F('created', 'Created on', 'date', { adv: true }), F('owner', 'Record owner', 'text', { gen: 'person', adv: true }), F('notes', 'Notes', 'textarea')] }], { titleKey: 'no' });

  ent('vendorBill', 'Vendor bill', 'Payables', 'finance', [{ title: 'Bill', fields: [F('no', 'Bill no.', 'code', { prefix: 'AP', col: true }), F('vendor', 'Vendor', 'text', { gen: 'company', col: true }), F('date', 'Bill date', 'date', { col: true, adv: true }), F('dueDate', 'Due date', 'date', { col: true }), F('amount', 'Amount', 'currency', { col: true }), F('status', 'Status', 'select', { options: ['Open', 'Approved', 'Scheduled', 'Paid', 'Disputed'], basic: true, col: true }), F('approver', 'Approver', 'text', { gen: 'person', adv: true })] }, audit]);

  ent('bankAccount', 'Bank account', 'Bank accounts', 'finance', [{ title: 'Bank', fields: [F('code', 'Code', 'code', { prefix: 'BNK', col: true }), F('bank', 'Bank', 'select', { options: ['Emirates NBD', 'HDFC Bank', 'DBS', 'Al Rajhi', 'HSBC'], col: true }), F('accountNo', 'Account no.', 'phone', { col: true }), F('currency', 'Currency', 'select', { options: ['AED', 'INR', 'SGD', 'SAR', 'USD'], col: true }), F('balance', 'Ledger balance', 'currency', { col: true, min: 10000, max: 5000000 }), F('swift', 'SWIFT', 'code', { prefix: 'SW' })] }, audit], { count: 7 });

  ent('costCenter', 'Cost center', 'Cost centers', 'finance', [{ title: 'Cost center', fields: [F('code', 'Code', 'code', { prefix: 'CC', col: true }), F('name', 'Name', 'select', { options: ['Sales - GCC', 'Sales - India', 'Warehouse Ops', 'IT', 'HR & Admin', 'Finance', 'Marketing', 'R&D'], col: true }), F('manager', 'Manager', 'text', { gen: 'person', col: true }), F('budget', 'Annual budget', 'currency', { col: true, min: 50000, max: 3000000 }), F('spent', 'Spent YTD', 'currency', { col: true, min: 20000, max: 2000000 })] }, audit], { count: 10 });

  ent('fixedAsset', 'Fixed asset', 'Fixed assets', 'finance', [{ title: 'Asset', fields: [F('code', 'Asset tag', 'code', { prefix: 'FA', col: true }), F('name', 'Asset', 'select', { options: ['Forklift', 'Delivery van', 'Server cluster', 'Office fit-out', 'CNC machine', 'Laptop fleet'], col: true }), F('acquired', 'Acquired on', 'date', { col: true }), F('cost', 'Cost', 'currency', { col: true, min: 5000, max: 800000 }), F('method', 'Depreciation', 'select', { options: ['Straight line', 'Declining balance'], basic: true, col: true }), F('life', 'Useful life (yrs)', 'number', { min: 3, max: 15, col: true }), F('location', 'Location', 'select', { options: BRANCHES, gen: 'branch' })] }, audit], { count: 22 });

  ent('budget', 'Budget', 'Budgets', 'finance', [{ title: 'Budget', fields: [F('code', 'Code', 'code', { prefix: 'BUD', col: true }), F('costCenter', 'Cost center', 'select', { options: ['Sales - GCC', 'Warehouse Ops', 'IT', 'HR & Admin', 'Marketing'], basic: true, col: true }), F('year', 'Fiscal year', 'select', { options: ['FY2025', 'FY2026', 'FY2027'], basic: true, col: true }), F('amount', 'Budgeted', 'currency', { col: true, min: 50000, max: 2000000 }), F('actual', 'Actual', 'currency', { col: true, min: 20000, max: 1800000 }), F('status', 'Status', 'select', { options: ['Draft', 'Approved', 'Locked'], col: true })] }, audit], { count: 15 });

  // ---------------- HR & PAYROLL ----------------
  ent('employee', 'Employee', 'Employees', 'hr', [
    { title: 'Personal', fields: [F('code', 'Employee ID', 'code', { prefix: 'EMP', col: true, req: true }), F('name', 'Full name', 'text', { gen: 'person', col: true, req: true }), F('email', 'Work email', 'email', { col: true }), F('phone', 'Mobile', 'phone'), F('dob', 'Date of birth', 'date'), F('gender', 'Gender', 'select', { options: ['Female', 'Male', 'Other'] }), F('nationality', 'Nationality', 'select', { options: COUNTRY })] },
    { title: 'Employment', fields: [F('department', 'Department', 'select', { options: ['Sales', 'Finance', 'Operations', 'IT', 'HR', 'Warehouse'], basic: true, col: true }), F('designation', 'Designation', 'select', { options: ['Manager', 'Senior Executive', 'Executive', 'Analyst', 'Supervisor', 'Director'], col: true }), F('joined', 'Date of joining', 'date', { col: true, adv: true }), F('type', 'Employment type', 'select', { options: ['Full-time', 'Contract', 'Part-time', 'Intern'], adv: true }), F('manager', 'Reports to', 'text', { gen: 'person' }), F('location', 'Work location', 'select', { options: BRANCHES, gen: 'branch', basic: true, col: true })] },
    { title: 'Compensation', fields: [F('basic', 'Basic salary', 'currency', { min: 3000, max: 45000 }), F('allowances', 'Allowances', 'currency', { min: 500, max: 12000 }), F('bank', 'Bank', 'select', { options: ['Emirates NBD', 'HDFC Bank', 'DBS'] }), F('iban', 'IBAN', 'code', { prefix: 'AE07' }), F('benefits', 'Benefits', 'multiselect', { options: ['Medical', 'Housing', 'Transport', 'Education', 'Air ticket'] })] },
    audit
  ], { actions: [{ label: 'View', act: 'view' }, { label: 'Edit', act: 'edit' }, { label: 'Payslip', act: 'toast', msg: 'Latest payslip downloaded' }, { label: 'Leave balance', act: 'toast', msg: 'Annual: 18 days, Sick: 7 days' }] });

  ent('department', 'Department', 'Departments', 'hr', [{ title: 'Department', fields: [F('code', 'Code', 'code', { prefix: 'DEP', col: true }), F('name', 'Department', 'select', { options: ['Sales', 'Finance', 'Operations', 'IT', 'HR', 'Warehouse', 'Legal', 'Marketing'], col: true }), F('head', 'Head', 'text', { gen: 'person', col: true }), F('headcount', 'Headcount', 'number', { min: 4, max: 120, col: true }), F('costCenter', 'Cost center', 'select', { options: ['CC-1001', 'CC-1002', 'CC-1003'] })] }, audit], { count: 8 });

  ent('designation', 'Designation', 'Designations', 'hr', [{ title: 'Designation', fields: [F('code', 'Code', 'code', { prefix: 'DSG', col: true }), F('name', 'Title', 'select', { options: ['Director', 'Manager', 'Senior Executive', 'Executive', 'Analyst', 'Supervisor', 'Associate'], col: true }), F('grade', 'Grade', 'select', { options: ['G1', 'G2', 'G3', 'G4', 'G5'], col: true, basic: true }), F('minSalary', 'Min salary', 'currency', { min: 3000, max: 20000, col: true }), F('maxSalary', 'Max salary', 'currency', { min: 20000, max: 80000, col: true })] }, audit], { count: 9 });

  ent('leave', 'Leave request', 'Leave requests', 'hr', [{ title: 'Leave', fields: [F('no', 'Request no.', 'code', { prefix: 'LV', col: true }), F('employee', 'Employee', 'text', { gen: 'person', col: true }), F('type', 'Leave type', 'select', { options: ['Annual', 'Sick', 'Maternity', 'Unpaid', 'Compassionate'], basic: true, col: true }), F('from', 'From', 'date', { col: true, adv: true }), F('to', 'To', 'date', { col: true }), F('days', 'Days', 'number', { min: 1, max: 14, col: true }), F('status', 'Status', 'select', { options: ['Pending', 'Approved', 'Rejected'], basic: true, col: true }), F('reason', 'Reason', 'textarea')] }], { actions: [{ label: 'Approve', act: 'toast', msg: 'Leave approved' }, { label: 'Reject', act: 'toast', msg: 'Leave rejected' }, { label: 'View', act: 'view' }] });

  ent('attendance', 'Attendance', 'Attendance', 'hr', [{ title: 'Attendance', fields: [F('employee', 'Employee', 'text', { gen: 'person', col: true }), F('date', 'Date', 'date', { col: true, adv: true }), F('in', 'Check-in', 'select', { options: ['08:02', '08:15', '08:47', '09:01', '09:30'], col: true }), F('out', 'Check-out', 'select', { options: ['17:00', '17:32', '18:05', '18:40', '19:15'], col: true }), F('hours', 'Hours', 'number', { min: 6, max: 11, col: true }), F('status', 'Status', 'select', { options: ['Present', 'Late', 'Half day', 'Absent', 'WFH'], basic: true, col: true }), F('location', 'Location', 'select', { options: BRANCHES, gen: 'branch', basic: true })] }], { count: 80 });

  ent('payrollRun', 'Payroll run', 'Payroll runs', 'hr', [{ title: 'Payroll run', fields: [F('no', 'Run no.', 'code', { prefix: 'PR', col: true }), F('period', 'Period', 'select', { options: ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'], basic: true, col: true }), F('branch', 'Branch', 'select', { options: BRANCHES, gen: 'branch', basic: true, col: true }), F('employees', 'Employees', 'number', { min: 20, max: 400, col: true }), F('gross', 'Gross', 'currency', { min: 200000, max: 4000000, col: true }), F('deductions', 'Deductions', 'currency', { min: 10000, max: 300000, col: true }), F('status', 'Status', 'select', { options: ['Draft', 'Calculated', 'Approved', 'Paid'], basic: true, col: true }), F('payDate', 'Pay date', 'date')] }], { count: 16, actions: [{ label: 'Calculate', act: 'toast', msg: 'Payroll calculation started' }, { label: 'Approve', act: 'toast', msg: 'Payroll run approved' }, { label: 'Bank file', act: 'toast', msg: 'WPS bank file generated' }, { label: 'View', act: 'view' }] });

  ent('salaryStructure', 'Salary structure', 'Salary structures', 'hr', [{ title: 'Structure', fields: [F('code', 'Code', 'code', { prefix: 'SS', col: true }), F('name', 'Name', 'select', { options: ['Standard UAE', 'Standard India', 'Executive', 'Contract', 'Intern'], col: true }), F('basicPct', 'Basic %', 'percent', { col: true }), F('components', 'Components', 'multiselect', { options: ['HRA', 'Transport', 'Medical', 'Bonus', 'Overtime', 'Gratuity'], col: true }), F('gratuity', 'Gratuity applicable', 'toggle')] }, audit], { count: 6 });

  ent('loan', 'Employee loan', 'Loans & advances', 'hr', [{ title: 'Loan', fields: [F('no', 'Loan no.', 'code', { prefix: 'LN', col: true }), F('employee', 'Employee', 'text', { gen: 'person', col: true }), F('type', 'Type', 'select', { options: ['Salary advance', 'Housing loan', 'Vehicle loan', 'Emergency'], basic: true, col: true }), F('amount', 'Amount', 'currency', { min: 2000, max: 80000, col: true }), F('installments', 'Installments', 'number', { min: 3, max: 36, col: true }), F('outstanding', 'Outstanding', 'currency', { min: 0, max: 60000, col: true }), F('status', 'Status', 'select', { options: ['Requested', 'Approved', 'Active', 'Closed'], basic: true, col: true })] }], { count: 20 });

  // ---------------- SUPPLY CHAIN ----------------
  ent('vendor', 'Vendor', 'Vendors', 'scm', [
    { title: 'General', fields: [F('code', 'Vendor code', 'code', { prefix: 'VEN', col: true }), F('name', 'Vendor name', 'text', { gen: 'company', col: true, req: true }), F('category', 'Category', 'select', { options: ['Raw material', 'Packaging', 'Services', 'Logistics', 'IT'], basic: true, col: true }), F('rating', 'Rating', 'select', { options: ['A', 'B', 'C'], col: true, basic: true }), F('taxId', 'Tax registration', 'code', { prefix: 'TRN' })] },
    { title: 'Contact', fields: [F('contact', 'Contact', 'text', { gen: 'person', col: true }), F('email', 'Email', 'email'), F('phone', 'Phone', 'phone'), F('city', 'City', 'text', { gen: 'city', col: true }), F('country', 'Country', 'select', { options: COUNTRY, adv: true })] },
    { title: 'Terms', fields: [F('terms', 'Payment terms', 'select', { options: ['Net 30', 'Net 60', 'Advance', 'LC'] }), F('leadTime', 'Lead time (days)', 'number', { min: 2, max: 60, col: true }), F('currency', 'Currency', 'select', { options: ['AED', 'INR', 'USD', 'CNY'] }), F('preferred', 'Preferred', 'toggle')] },
    audit
  ]);

  ent('purchaseOrder', 'Purchase order', 'Purchase orders', 'scm', [{ title: 'Order', fields: [F('no', 'PO no.', 'code', { prefix: 'PO', col: true }), F('vendor', 'Vendor', 'text', { gen: 'company', col: true }), F('date', 'PO date', 'date', { col: true, adv: true }), F('expected', 'Expected', 'date', { col: true }), F('amount', 'Amount', 'currency', { col: true }), F('status', 'Status', 'select', { options: ['Draft', 'Sent', 'Confirmed', 'Partially received', 'Received', 'Closed'], basic: true, col: true }), F('warehouse', 'Deliver to', 'select', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub', 'Riyadh WH'], basic: true, col: true }), F('buyer', 'Buyer', 'text', { gen: 'person', adv: true }), F('notes', 'Remarks', 'textarea')] }], { actions: [{ label: 'View', act: 'view' }, { label: 'Edit', act: 'edit' }, { label: 'Receive goods', act: 'toast', msg: 'GRN drafted from PO' }] });

  ent('grn', 'Goods receipt', 'Goods receipts', 'scm', [{ title: 'Receipt', fields: [F('no', 'GRN no.', 'code', { prefix: 'GRN', col: true }), F('po', 'PO ref', 'code', { prefix: 'PO', col: true }), F('vendor', 'Vendor', 'text', { gen: 'company', col: true }), F('date', 'Received on', 'date', { col: true, adv: true }), F('warehouse', 'Warehouse', 'select', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub'], basic: true, col: true }), F('lines', 'Lines', 'number', { min: 1, max: 20, col: true }), F('qc', 'QC status', 'select', { options: ['Pending', 'Passed', 'Failed', 'Partial'], basic: true, col: true })] }]);

  ent('warehouse', 'Warehouse', 'Warehouses', 'scm', [{ title: 'Warehouse', fields: [F('code', 'Code', 'code', { prefix: 'WH', col: true }), F('name', 'Name', 'select', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub', 'Riyadh WH', 'Nairobi Depot', 'Doha Cross-dock'], col: true }), F('city', 'City', 'text', { gen: 'city', col: true }), F('type', 'Type', 'select', { options: ['Distribution', 'Cold storage', 'Bonded', 'Cross-dock'], basic: true, col: true }), F('capacity', 'Capacity (pallets)', 'number', { min: 500, max: 12000, col: true }), F('utilization', 'Utilization %', 'percent', { col: true }), F('manager', 'Manager', 'text', { gen: 'person' })] }, audit], { count: 6 });

  ent('stockItem', 'Stock balance', 'Stock balances', 'scm', [{ title: 'Stock', fields: [F('sku', 'SKU', 'code', { prefix: 'SKU', col: true }), F('item', 'Item', 'text', { gen: 'product', col: true }), F('warehouse', 'Warehouse', 'select', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub', 'Riyadh WH'], basic: true, col: true }), F('bin', 'Bin', 'code', { prefix: 'B', col: true }), F('onHand', 'On hand', 'number', { min: 0, max: 5000, col: true }), F('reserved', 'Reserved', 'number', { min: 0, max: 800, col: true }), F('value', 'Stock value', 'currency', { col: true }), F('lastCount', 'Last counted', 'date', { adv: true })] }], { count: 90 });

  ent('transfer', 'Stock transfer', 'Stock transfers', 'scm', [{ title: 'Transfer', fields: [F('no', 'Transfer no.', 'code', { prefix: 'TRF', col: true }), F('from', 'From', 'select', { options: ['Jebel Ali WH', 'Chennai DC', 'Tuas Hub'], basic: true, col: true }), F('to', 'To', 'select', { options: ['Riyadh WH', 'Nairobi Depot', 'Doha Cross-dock'], basic: true, col: true }), F('date', 'Date', 'date', { col: true, adv: true }), F('lines', 'Lines', 'number', { min: 1, max: 15, col: true }), F('status', 'Status', 'select', { options: ['Draft', 'In transit', 'Received', 'Cancelled'], basic: true, col: true })] }]);

  ent('requisition', 'Requisition', 'Purchase requisitions', 'scm', [{ title: 'Requisition', fields: [F('no', 'PR no.', 'code', { prefix: 'PRQ', col: true }), F('requester', 'Requested by', 'text', { gen: 'person', col: true }), F('department', 'Department', 'select', { options: ['Sales', 'Operations', 'IT', 'Warehouse'], basic: true, col: true }), F('date', 'Date', 'date', { col: true, adv: true }), F('needBy', 'Need by', 'date', { col: true }), F('estimate', 'Estimated value', 'currency', { col: true }), F('status', 'Status', 'select', { options: ['Submitted', 'Approved', 'Converted to PO', 'Rejected'], basic: true, col: true }), F('justification', 'Justification', 'textarea')] }], { actions: [{ label: 'Approve', act: 'toast', msg: 'Requisition approved' }, { label: 'Create PO', act: 'toast', msg: 'Purchase order drafted' }, { label: 'View', act: 'view' }] });

  // ---------------- MODULES & MENUS ----------------
  const wl = (e) => ({ page: 'worklist', entity: e });
  const MODULES = [
    { id: 'sales', name: 'Sales & Billing', short: 'SB', tagline: 'Orders, billing, receivables', sections: [
      { title: 'masters', items: [
        { id: 'sm-cust', label: 'Customers', icon: 'C', children: [{ label: 'Customer master', route: wl('customer') }, { label: 'Customer groups', route: wl('customerGroup') }, { label: 'Sales team', route: wl('salesperson') }] },
        { id: 'sm-prod', label: 'Products & pricing', icon: 'P', children: [{ label: 'Product master', route: wl('product') }, { label: 'Price lists', route: wl('priceList') }] },
        { id: 'sm-tax', label: 'Taxation', icon: 'T', children: [{ label: 'Tax codes', route: wl('tax') }, { label: 'Jurisdictions', route: wl('jurisdiction') }] }
      ] },
      { title: 'transactions', items: [
        { id: 'st-pre', label: 'Pre-sales', icon: 'Q', children: [{ label: 'Quotations', route: wl('quotation') }, { label: 'Sales orders', route: wl('salesOrder') }] },
        { id: 'st-bill', label: 'Billing', icon: 'B', children: [{ label: 'Billing worklist', route: wl('invoice') }, { label: 'New tax invoice', route: { page: 'billing' } }, { label: 'Receipts', route: wl('receipt') }] },
        { id: 'st-xl', label: 'Bulk & Excel', icon: 'X', children: [{ label: 'Excel utility', route: { page: 'excel' } }] }
      ] },
      { title: 'reports', items: [{ id: 'sr', label: 'Sales reports', icon: 'R', children: [{ label: 'Report center', route: { page: 'reports' } }] }] },
      { title: 'configuration', items: [{ id: 'sc', label: 'Configuration', icon: 'S', children: [{ label: 'My preferences', route: { page: 'prefs' } }, { label: 'System settings', route: { page: 'settings' } }] }] }
    ] },
    { id: 'finance', name: 'Finance', short: 'FN', tagline: 'Ledger, payables, assets', sections: [
      { title: 'masters', items: [
        { id: 'fm-gl', label: 'General ledger', icon: 'G', children: [{ label: 'Chart of accounts', route: wl('glAccount') }, { label: 'Cost centers', route: wl('costCenter') }] },
        { id: 'fm-bank', label: 'Banking', icon: 'B', children: [{ label: 'Bank accounts', route: wl('bankAccount') }] },
        { id: 'fm-fa', label: 'Fixed assets', icon: 'A', children: [{ label: 'Asset register', route: wl('fixedAsset') }] }
      ] },
      { title: 'transactions', items: [
        { id: 'ft-jv', label: 'Journals', icon: 'J', children: [{ label: 'Journal entries', route: wl('journal') }] },
        { id: 'ft-ap', label: 'Payables', icon: 'P', children: [{ label: 'Vendor bills', route: wl('vendorBill') }] },
        { id: 'ft-bud', label: 'Budgeting', icon: 'U', children: [{ label: 'Budgets', route: wl('budget') }] },
        { id: 'ft-xl', label: 'Bulk & Excel', icon: 'X', children: [{ label: 'Excel utility', route: { page: 'excel' } }] }
      ] },
      { title: 'reports', items: [{ id: 'fr', label: 'Financial reports', icon: 'R', children: [{ label: 'Report center', route: { page: 'reports' } }] }] },
      { title: 'configuration', items: [{ id: 'fc', label: 'Configuration', icon: 'S', children: [{ label: 'My preferences', route: { page: 'prefs' } }, { label: 'System settings', route: { page: 'settings' } }] }] }
    ] },
    { id: 'hr', name: 'HR & Payroll', short: 'HR', tagline: 'People, leave, payroll', sections: [
      { title: 'masters', items: [
        { id: 'hm-emp', label: 'People', icon: 'E', children: [{ label: 'Employees', route: wl('employee') }, { label: 'Departments', route: wl('department') }, { label: 'Designations', route: wl('designation') }] },
        { id: 'hm-pay', label: 'Payroll setup', icon: 'S', children: [{ label: 'Salary structures', route: wl('salaryStructure') }] }
      ] },
      { title: 'transactions', items: [
        { id: 'ht-time', label: 'Time & leave', icon: 'L', children: [{ label: 'Leave requests', route: wl('leave') }, { label: 'Attendance', route: wl('attendance') }] },
        { id: 'ht-pay', label: 'Payroll', icon: 'P', children: [{ label: 'Payroll runs', route: wl('payrollRun') }, { label: 'Loans & advances', route: wl('loan') }] },
        { id: 'ht-xl', label: 'Bulk & Excel', icon: 'X', children: [{ label: 'Excel utility', route: { page: 'excel' } }] }
      ] },
      { title: 'reports', items: [{ id: 'hr-r', label: 'HR reports', icon: 'R', children: [{ label: 'Report center', route: { page: 'reports' } }] }] },
      { title: 'configuration', items: [{ id: 'hc', label: 'Configuration', icon: 'S', children: [{ label: 'My preferences', route: { page: 'prefs' } }, { label: 'System settings', route: { page: 'settings' } }] }] }
    ] },
    { id: 'scm', name: 'Supply Chain', short: 'SC', tagline: 'Procurement, inventory', sections: [
      { title: 'masters', items: [
        { id: 'cm-ven', label: 'Vendors', icon: 'V', children: [{ label: 'Vendor master', route: wl('vendor') }] },
        { id: 'cm-wh', label: 'Warehousing', icon: 'W', children: [{ label: 'Warehouses', route: wl('warehouse') }, { label: 'Stock balances', route: wl('stockItem') }] }
      ] },
      { title: 'transactions', items: [
        { id: 'ct-proc', label: 'Procurement', icon: 'P', children: [{ label: 'Requisitions', route: wl('requisition') }, { label: 'Purchase orders', route: wl('purchaseOrder') }, { label: 'Goods receipts', route: wl('grn') }] },
        { id: 'ct-inv', label: 'Inventory', icon: 'I', children: [{ label: 'Stock transfers', route: wl('transfer') }] },
        { id: 'ct-xl', label: 'Bulk & Excel', icon: 'X', children: [{ label: 'Excel utility', route: { page: 'excel' } }] }
      ] },
      { title: 'reports', items: [{ id: 'cr', label: 'Supply chain reports', icon: 'R', children: [{ label: 'Report center', route: { page: 'reports' } }] }] },
      { title: 'configuration', items: [{ id: 'cc', label: 'Configuration', icon: 'S', children: [{ label: 'My preferences', route: { page: 'prefs' } }, { label: 'System settings', route: { page: 'settings' } }] }] }
    ] },
    { id: 'library', name: 'Library', short: 'LB', tagline: 'Components & developer guide', sections: [
      { title: 'foundations', items: [
        { id: 'lb-over', label: 'Overview', icon: 'O', children: [{ label: 'Architecture', route: { page: 'library', section: 'overview' } }, { label: 'Preferences engine', route: { page: 'library', section: 'prefs' } }, { label: 'Theming', route: { page: 'library', section: 'themes' } }, { label: 'Localization', route: { page: 'library', section: 'i18n' } }] }
      ] },
      { title: 'components', items: [
        { id: 'lb-ctl', label: 'Controls', icon: 'C', children: [{ label: 'Buttons & inputs', route: { page: 'library', section: 'controls' } }, { label: 'Selects & pickers', route: { page: 'library', section: 'selects' } }, { label: 'Feedback (toast, modal)', route: { page: 'library', section: 'feedback' } }] },
        { id: 'lb-pat', label: 'Patterns', icon: 'P', children: [{ label: 'Worklist', route: { page: 'library', section: 'worklist' } }, { label: 'Form layouts', route: { page: 'library', section: 'forms' } }, { label: 'Navigation shell', route: { page: 'library', section: 'shell' } }] }
      ] },
      { title: 'developer', items: [
        { id: 'lb-dev', label: 'Handoff', icon: 'D', children: [{ label: 'Next.js project structure', route: { page: 'library', section: 'nextjs' } }, { label: 'TypeScript contracts', route: { page: 'library', section: 'types' } }, { label: 'Tailwind & tokens', route: { page: 'library', section: 'tailwind' } }, { label: 'Keyboard shortcuts', route: { page: 'library', section: 'keys' } }] }
      ] }
    ] }
  ];

  // ---------------- DASHBOARDS ----------------
  const DASH = {
    sales: { kpis: [{ label: 'Revenue MTD', value: 'AED 4.82M', delta: '+12.4%', up: true }, { label: 'Open orders', value: '318', delta: '+27', up: true }, { label: 'Overdue receivables', value: 'AED 612K', delta: '-8.1%', up: false }, { label: 'Quote win rate', value: '38%', delta: '+3 pts', up: true }], chart: { title: 'Monthly revenue (AED M)', series: [3.1, 3.6, 3.4, 4.0, 4.4, 4.1, 4.7, 4.8], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] }, breakdown: { title: 'Revenue by branch', rows: [['Dubai HQ', 46], ['Chennai', 24], ['Singapore', 18], ['Riyadh', 12]] }, recent: { title: 'Recent invoices', entity: 'invoice' }, tasks: ['3 quotations expire this week', '12 invoices pending approval', 'Price list Promo Q3 ends 30 Sep'] },
    finance: { kpis: [{ label: 'Cash position', value: 'AED 18.4M', delta: '+2.1%', up: true }, { label: 'AP due 30 days', value: 'AED 2.9M', delta: '+14%', up: false }, { label: 'AR outstanding', value: 'AED 6.1M', delta: '-4.5%', up: true }, { label: 'Unposted journals', value: '27', delta: '+9', up: false }], chart: { title: 'Cash flow (AED M)', series: [1.2, 0.8, 1.9, 1.1, 2.4, 1.6, 2.1, 2.7], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] }, breakdown: { title: 'Expenses by cost center', rows: [['Warehouse Ops', 34], ['Sales - GCC', 28], ['IT', 21], ['HR & Admin', 17]] }, recent: { title: 'Recent journals', entity: 'journal' }, tasks: ['Period 2026-P08 closes in 4 days', '5 bank reconciliations pending', 'VAT return due 28 Sep'] },
    hr: { kpis: [{ label: 'Headcount', value: '1,284', delta: '+18', up: true }, { label: 'Attrition (12m)', value: '7.9%', delta: '-1.2 pts', up: true }, { label: 'Pending leave', value: '46', delta: '+11', up: false }, { label: 'Payroll Aug', value: 'AED 9.7M', delta: '+1.8%', up: true }], chart: { title: 'Headcount by month', series: [1210, 1218, 1231, 1240, 1252, 1261, 1270, 1284], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] }, breakdown: { title: 'Headcount by department', rows: [['Operations', 38], ['Sales', 26], ['Warehouse', 20], ['Finance & IT', 16]] }, recent: { title: 'Recent leave requests', entity: 'leave' }, tasks: ['Payroll Aug 2026 awaiting approval', '9 probation reviews due', 'Visa renewals: 14 in 60 days'] },
    scm: { kpis: [{ label: 'Stock value', value: 'AED 31.2M', delta: '+3.4%', up: true }, { label: 'Open POs', value: '142', delta: '-6', up: true }, { label: 'Stockouts', value: '17 SKUs', delta: '+5', up: false }, { label: 'On-time receipt', value: '91%', delta: '+2 pts', up: true }], chart: { title: 'Inbound receipts (lines)', series: [420, 510, 470, 590, 620, 580, 640, 700], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] }, breakdown: { title: 'Utilization by warehouse', rows: [['Jebel Ali WH', 88], ['Chennai DC', 72], ['Tuas Hub', 65], ['Riyadh WH', 54]] }, recent: { title: 'Recent purchase orders', entity: 'purchaseOrder' }, tasks: ['17 SKUs below reorder level', '6 GRNs pending QC', 'Vendor rating review: Q3'] },
    library: { kpis: [{ label: 'Components', value: '42', delta: 'shared', up: true }, { label: 'Themes', value: '8', delta: 'runtime', up: true }, { label: 'Languages', value: '5', delta: 'incl. RTL', up: true }, { label: 'Pages', value: '60+', delta: 'schema-driven', up: true }], chart: { title: 'Component reuse (pages per component)', series: [60, 58, 44, 40, 36, 31, 28, 22], labels: ['Button', 'Input', 'Select', 'Table', 'Toast', 'Modal', 'Tabs', 'Wizard'] }, breakdown: { title: 'Code by layer', rows: [['Components', 42], ['Schemas', 28], ['Pages', 18], ['Services', 12]] }, recent: null, tasks: ['Read Architecture first', 'Preferences drive every layout choice', 'All pages are entity schemas'] }
  };

  // ---------------- REPORTS ----------------
  const REPORTS = {
    sales: [{ id: 'sales-by-cust', name: 'Sales by customer', cols: ['Customer', 'Invoices', 'Revenue', 'Avg. days to pay'] }, { id: 'ar-aging', name: 'Receivables aging', cols: ['Customer', 'Current', '1-30', '31-60', '60+'] }, { id: 'tax-summary', name: 'Tax summary', cols: ['Tax code', 'Taxable', 'Tax', 'Jurisdiction'] }, { id: 'sp-perf', name: 'Salesperson performance', cols: ['Salesperson', 'Target', 'Achieved', '%'] }],
    finance: [{ id: 'tb', name: 'Trial balance', cols: ['Account', 'Opening', 'Debit', 'Credit', 'Closing'] }, { id: 'pl', name: 'Profit & loss', cols: ['Line', 'This period', 'Last period', 'Variance'] }, { id: 'bs', name: 'Balance sheet', cols: ['Line', 'Amount', 'Prior year'] }, { id: 'ap-aging', name: 'Payables aging', cols: ['Vendor', 'Current', '1-30', '31-60', '60+'] }],
    hr: [{ id: 'headcount', name: 'Headcount report', cols: ['Department', 'Opening', 'Joined', 'Left', 'Closing'] }, { id: 'payroll-reg', name: 'Payroll register', cols: ['Employee', 'Basic', 'Allowances', 'Deductions', 'Net'] }, { id: 'leave-bal', name: 'Leave balances', cols: ['Employee', 'Annual', 'Sick', 'Taken', 'Balance'] }, { id: 'attendance', name: 'Attendance summary', cols: ['Employee', 'Present', 'Late', 'Absent', 'Hours'] }],
    scm: [{ id: 'stock-val', name: 'Stock valuation', cols: ['Warehouse', 'SKUs', 'Qty', 'Value'] }, { id: 'reorder', name: 'Reorder report', cols: ['SKU', 'Item', 'On hand', 'Reorder level', 'Shortfall'] }, { id: 'vendor-perf', name: 'Vendor performance', cols: ['Vendor', 'POs', 'On-time %', 'Rejections'] }, { id: 'po-status', name: 'PO status', cols: ['PO', 'Vendor', 'Amount', 'Received %'] }],
    library: [{ id: 'usage', name: 'Component usage', cols: ['Component', 'Pages', 'Variants', 'Owner'] }]
  };

  const NOTIFICATIONS = [
    { title: 'Invoice INV-1042 overdue', body: 'Northgate Retail, AED 48,200 due 4 days ago', time: '12m', kind: 'warn' },
    { title: 'Payroll Aug 2026 ready for approval', body: '1,284 employees, gross AED 9.7M', time: '1h', kind: 'info' },
    { title: 'PO-1108 confirmed by vendor', body: 'Delta Freight, expected 09 Sep', time: '3h', kind: 'ok' },
    { title: 'Stockout: LED Panel 40W', body: 'Jebel Ali WH, 0 on hand, 3 open orders', time: '5h', kind: 'danger' },
    { title: 'Period 2026-P08 closing', body: '27 unposted journals remain', time: '1d', kind: 'info' }
  ];

  const USER = { name: 'Priya Nair', title: 'Regional Finance Controller', email: 'priya.nair@halcyon.com', initials: 'PN', branches: BRANCHES, roles: ['Finance Controller', 'Billing Supervisor', 'HR Viewer', 'Procurement Approver'], employeeId: 'EMP-1042', since: '2019-03-11' };

  // ---------------- THEMES ----------------
  const THEMES = {
    light: { name: 'Light', bg: '#f6f7f8', surface: '#ffffff', surface2: '#f1f3f5', border: '#dfe3e7', text: '#1c2127', muted: '#5f6b76', accent: '#1f6f8b', accentFg: '#ffffff', danger: '#b42318', success: '#1e7f4f', warn: '#b45309', field: '#ffffff', sidebar: '#1c2127', sidebarText: '#d5dbe1', shadow: '0 8px 24px rgba(16,24,40,.12)' },
    dark: { name: 'Dark', bg: '#121517', surface: '#1a1e22', surface2: '#22272c', border: '#2f363d', text: '#e6e9ec', muted: '#98a2ad', accent: '#4fb3d1', accentFg: '#0b1a20', danger: '#f97066', success: '#4ade80', warn: '#fbbf24', field: '#15191c', sidebar: '#0d1012', sidebarText: '#c7ced5', shadow: '0 8px 24px rgba(0,0,0,.5)' },
    contrast: { name: 'High contrast', bg: '#ffffff', surface: '#ffffff', surface2: '#f2f2f2', border: '#000000', text: '#000000', muted: '#333333', accent: '#0000d6', accentFg: '#ffffff', danger: '#c40000', success: '#006b1f', warn: '#8a4b00', field: '#ffffff', sidebar: '#000000', sidebarText: '#ffffff', shadow: '0 0 0 2px #000' },
    midnight: { name: 'Midnight blue', bg: '#0b1220', surface: '#111a2e', surface2: '#172238', border: '#25324d', text: '#e2e8f4', muted: '#93a1bd', accent: '#7aa2ff', accentFg: '#0b1220', danger: '#ff7b72', success: '#56d364', warn: '#e3b341', field: '#0e1628', sidebar: '#070d19', sidebarText: '#b9c4dc', shadow: '0 8px 24px rgba(0,0,0,.55)' },
    forest: { name: 'Forest', bg: '#f3f5f1', surface: '#ffffff', surface2: '#e9eee6', border: '#cfd8ca', text: '#1d2a1f', muted: '#5c6b5e', accent: '#2f6b3a', accentFg: '#ffffff', danger: '#a33a2a', success: '#2f6b3a', warn: '#9a6a12', field: '#ffffff', sidebar: '#1b3220', sidebarText: '#cfe0d1', shadow: '0 8px 24px rgba(29,42,31,.14)' },
    sand: { name: 'Sand / warm', bg: '#f7f3ec', surface: '#fffdf8', surface2: '#f1ebe0', border: '#e0d6c6', text: '#2b2520', muted: '#736a5f', accent: '#a0521f', accentFg: '#ffffff', danger: '#b3261e', success: '#3d7a3a', warn: '#a56a00', field: '#fffdf8', sidebar: '#2b2520', sidebarText: '#e6ddd0', shadow: '0 8px 24px rgba(43,37,32,.12)' },
    slate: { name: 'Corporate slate', bg: '#eef1f4', surface: '#ffffff', surface2: '#e4e8ed', border: '#c9d1da', text: '#1f2937', muted: '#64748b', accent: '#334e68', accentFg: '#ffffff', danger: '#b91c1c', success: '#166534', warn: '#92400e', field: '#ffffff', sidebar: '#243b53', sidebarText: '#d9e2ec', shadow: '0 8px 24px rgba(31,41,55,.14)' },
    solarized: { name: 'Solarized', bg: '#fdf6e3', surface: '#fffbf0', surface2: '#eee8d5', border: '#d9d2bd', text: '#073642', muted: '#657b83', accent: '#268bd2', accentFg: '#fdf6e3', danger: '#dc322f', success: '#859900', warn: '#b58900', field: '#fffbf0', sidebar: '#002b36', sidebarText: '#93a1a1', shadow: '0 8px 24px rgba(7,54,66,.14)' }
  };

  const FONTS = [{ id: 'IBM Plex Sans', label: 'IBM Plex Sans (default)' }, { id: 'Source Sans 3', label: 'Source Sans 3' }, { id: 'Nunito Sans', label: 'Nunito Sans' }, { id: 'system-ui', label: 'System UI' }, { id: 'Georgia', label: 'Georgia (serif)' }, { id: 'IBM Plex Mono', label: 'IBM Plex Mono' }];

  // ---------------- I18N ----------------
  const I18N = {
    en: { _name: 'English', _dir: 'ltr', dashboard: 'Dashboard', masters: 'Masters', transactions: 'Transactions', reports: 'Reports', configuration: 'Configuration', foundations: 'Foundations', components: 'Components', developer: 'Developer', search: 'Search', advanced: 'Advanced filters', new: 'New', view: 'View', edit: 'Edit', save: 'Save', cancel: 'Cancel', next: 'Next', back: 'Back', export: 'Export CSV', columns: 'Columns', rowsPerPage: 'Rows per page', of: 'of', notifications: 'Notifications', branch: 'Branch', role: 'Role', settings: 'Settings', myProfile: 'My profile', myPreferences: 'My preferences', signOut: 'Sign out', module: 'Module', help: 'Help', docs: 'Documentation', table: 'Table', cards: 'Cards', records: 'records', quickView: 'Quick view', close: 'Close', print: 'Print', schedule: 'Schedule', run: 'Run report', clear: 'Clear', pin: 'Pin sidebar', unpin: 'Unpin sidebar', welcome: 'Good morning', tasks: 'Attention needed', recent: 'Recent', shortcuts: 'Keyboard shortcuts', tour: 'Guided tour', noResults: 'No records match your filters', showing: 'Showing' },
    ar: { _name: 'العربية', _dir: 'rtl', dashboard: 'لوحة التحكم', masters: 'البيانات الرئيسية', transactions: 'المعاملات', reports: 'التقارير', configuration: 'الإعدادات', foundations: 'الأساسيات', components: 'المكونات', developer: 'المطور', search: 'بحث', advanced: 'فلاتر متقدمة', new: 'جديد', view: 'عرض', edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء', next: 'التالي', back: 'رجوع', export: 'تصدير CSV', columns: 'الأعمدة', rowsPerPage: 'صفوف لكل صفحة', of: 'من', notifications: 'الإشعارات', branch: 'الفرع', role: 'الدور', settings: 'الإعدادات', myProfile: 'ملفي الشخصي', myPreferences: 'تفضيلاتي', signOut: 'تسجيل الخروج', module: 'الوحدة', help: 'مساعدة', docs: 'التوثيق', table: 'جدول', cards: 'بطاقات', records: 'سجلات', quickView: 'عرض سريع', close: 'إغلاق', print: 'طباعة', schedule: 'جدولة', run: 'تشغيل التقرير', clear: 'مسح', pin: 'تثبيت الشريط', unpin: 'إلغاء التثبيت', welcome: 'صباح الخير', tasks: 'يتطلب الاهتمام', recent: 'الأخيرة', shortcuts: 'اختصارات لوحة المفاتيح', tour: 'جولة إرشادية', noResults: 'لا توجد سجلات مطابقة', showing: 'عرض' },
    hi: { _name: 'हिन्दी', _dir: 'ltr', dashboard: 'डैशबोर्ड', masters: 'मास्टर', transactions: 'लेन-देन', reports: 'रिपोर्ट', configuration: 'कॉन्फ़िगरेशन', foundations: 'आधार', components: 'घटक', developer: 'डेवलपर', search: 'खोजें', advanced: 'उन्नत फ़िल्टर', new: 'नया', view: 'देखें', edit: 'संपादित करें', save: 'सहेजें', cancel: 'रद्द करें', next: 'आगे', back: 'पीछे', export: 'CSV निर्यात', columns: 'कॉलम', rowsPerPage: 'प्रति पृष्ठ पंक्तियाँ', of: 'में से', notifications: 'सूचनाएँ', branch: 'शाखा', role: 'भूमिका', settings: 'सेटिंग्स', myProfile: 'मेरी प्रोफ़ाइल', myPreferences: 'मेरी प्राथमिकताएँ', signOut: 'साइन आउट', module: 'मॉड्यूल', help: 'सहायता', docs: 'दस्तावेज़', table: 'तालिका', cards: 'कार्ड', records: 'रिकॉर्ड', quickView: 'त्वरित दृश्य', close: 'बंद करें', print: 'प्रिंट', schedule: 'शेड्यूल', run: 'रिपोर्ट चलाएँ', clear: 'साफ़ करें', pin: 'साइडबार पिन करें', unpin: 'अनपिन करें', welcome: 'सुप्रभात', tasks: 'ध्यान दें', recent: 'हाल के', shortcuts: 'कीबोर्ड शॉर्टकट', tour: 'निर्देशित टूर', noResults: 'कोई रिकॉर्ड नहीं मिला', showing: 'दिखा रहे हैं' },
    es: { _name: 'Español', _dir: 'ltr', dashboard: 'Panel', masters: 'Maestros', transactions: 'Transacciones', reports: 'Informes', configuration: 'Configuración', foundations: 'Fundamentos', components: 'Componentes', developer: 'Desarrollador', search: 'Buscar', advanced: 'Filtros avanzados', new: 'Nuevo', view: 'Ver', edit: 'Editar', save: 'Guardar', cancel: 'Cancelar', next: 'Siguiente', back: 'Atrás', export: 'Exportar CSV', columns: 'Columnas', rowsPerPage: 'Filas por página', of: 'de', notifications: 'Notificaciones', branch: 'Sucursal', role: 'Rol', settings: 'Ajustes', myProfile: 'Mi perfil', myPreferences: 'Mis preferencias', signOut: 'Cerrar sesión', module: 'Módulo', help: 'Ayuda', docs: 'Documentación', table: 'Tabla', cards: 'Tarjetas', records: 'registros', quickView: 'Vista rápida', close: 'Cerrar', print: 'Imprimir', schedule: 'Programar', run: 'Ejecutar informe', clear: 'Limpiar', pin: 'Fijar barra', unpin: 'Soltar barra', welcome: 'Buenos días', tasks: 'Requiere atención', recent: 'Recientes', shortcuts: 'Atajos de teclado', tour: 'Recorrido guiado', noResults: 'Ningún registro coincide', showing: 'Mostrando' },
    zh: { _name: '中文', _dir: 'ltr', dashboard: '仪表板', masters: '主数据', transactions: '业务', reports: '报表', configuration: '配置', foundations: '基础', components: '组件', developer: '开发者', search: '搜索', advanced: '高级筛选', new: '新建', view: '查看', edit: '编辑', save: '保存', cancel: '取消', next: '下一步', back: '上一步', export: '导出 CSV', columns: '列', rowsPerPage: '每页行数', of: '共', notifications: '通知', branch: '分支机构', role: '角色', settings: '设置', myProfile: '我的资料', myPreferences: '我的偏好', signOut: '退出登录', module: '模块', help: '帮助', docs: '文档', table: '表格', cards: '卡片', records: '条记录', quickView: '快速查看', close: '关闭', print: '打印', schedule: '计划', run: '运行报表', clear: '清除', pin: '固定侧栏', unpin: '取消固定', welcome: '早上好', tasks: '需要关注', recent: '最近', shortcuts: '键盘快捷键', tour: '引导教程', noResults: '没有匹配的记录', showing: '显示' }
  };

  // ---------------- DOCS & TOURS ----------------
  const DOCS = {
    dashboard: { title: 'About this dashboard', body: 'KPIs refresh from posted transactions every 15 minutes. Click any recent record to open a quick view; the layout of that quick view (center card, modal, or side panel) follows My preferences.' },
    worklist: { title: 'Working with worklists', body: 'Type in Search to match any visible column. Basic filters sit beside the search; Advanced filters expand below. Use Columns to choose and reorder what you see, click a header to sort, and switch between Table and Cards. View, Edit and New open in a new workspace tab.' },
    form: { title: 'Record forms', body: 'Every record uses the same field schema. Whether it renders as a rail, tabs or a wizard is a personal preference. Required fields are marked; Ctrl+S saves, Esc closes the tab.' },
    billing: { title: 'Tax invoice entry', body: 'Header tabs hold the bill, customer and insurance details. Lines compute tax by product tax rate; Payments reduce balance due. Print produces the jurisdiction-compliant tax invoice.' },
    reports: { title: 'Report center', body: 'Pick a report, set the date range and filters, then Run to view on screen or Schedule to deliver by email to your login address on a recurring basis.' },
    excel: { title: 'Excel utility', body: 'A spreadsheet surface for bulk work. Type values or formulas (=SUM(B2:B6), =B2*C2). Drop a CSV onto the grid or use Import; Export writes the current sheet back to CSV.' },
    prefs: { title: 'My preferences', body: 'Changes apply instantly across every page and are saved to this browser. Layout choices (form style, result view, quick view, toast position) are honoured by all modules.' },
    library: { title: 'Library', body: 'The Library documents every shared component and pattern used in this application, plus the developer handoff for the Next.js build.' },
    settings: { title: 'System settings', body: 'Organization-wide configuration: company, branches, roles and numbering series.' },
    profile: { title: 'My profile', body: 'Your identity, assigned branches and roles as provisioned by the administrator.' }
  };

  const TOURS = {
    worklist: [{ target: 'search', title: 'Find records', text: 'Start typing to search across all visible columns. Press / to jump here from anywhere.' }, { target: 'filters', title: 'Refine with filters', text: 'Basic filters are always visible. Open Advanced filters for dates and less common fields.' }, { target: 'view', title: 'Choose a view', text: 'Switch between a dense table and a card grid. Your choice is saved in preferences.' }, { target: 'columns', title: 'Pick your columns', text: 'Show or hide columns per worklist. Click a header to sort.' }, { target: 'new', title: 'Create a record', text: 'New opens a blank form in a new tab. Alt+N does the same.' }, { target: 'rows', title: 'Open a record', text: 'Click a row for a quick view with limited data and actions; use View or Edit for the full form.' }, { target: 'pager', title: 'Move through pages', text: 'Change rows per page from 10 to 100 and step through results.' }],
    form: [{ target: 'form-nav', title: 'Sections', text: 'The record is grouped into sections. Navigate with the rail, tabs or wizard steps.' }, { target: 'form-body', title: 'Fields', text: 'All controls are shared components: text, select, multi-select, date, toggle.' }, { target: 'form-actions', title: 'Save', text: 'Save shows a toast where your preferences place it. Ctrl+S also works.' }],
    billing: [{ target: 'bill-tabs', title: 'Header entries', text: 'Bill, customer and insurance details live in header tabs.' }, { target: 'bill-lines', title: 'Line items', text: 'Add products; quantity, price and tax compute totals live.' }, { target: 'bill-summary', title: 'Totals', text: 'Subtotal, tax and balance update as you type. Print produces the tax invoice.' }],
    dashboard: [{ target: 'kpis', title: 'Key figures', text: 'Four headline metrics for the module with change versus last period.' }, { target: 'chart', title: 'Trend', text: 'Eight-month trend of the primary measure.' }, { target: 'recent', title: 'Recent activity', text: 'Latest records; click to quick-view.' }],
    reports: [{ target: 'report-list', title: 'Pick a report', text: 'Reports are grouped by module.' }, { target: 'report-filters', title: 'Filter', text: 'Date range presets plus advanced filters.' }, { target: 'report-actions', title: 'Run or schedule', text: 'Run to see results now, or schedule delivery to your email.' }],
    excel: [{ target: 'sheet-bar', title: 'Formula bar', text: 'Select a cell; type a value or a formula starting with =.' }, { target: 'sheet', title: 'Grid', text: 'Arrow keys move, Enter commits, Tab moves right. Drop a CSV here.' }, { target: 'sheet-tools', title: 'Import & export', text: 'Import CSV, Fill down, Export.' }],
    prefs: [{ target: 'prefs-theme', title: 'Themes', text: 'Eight themes; every component picks up tokens instantly.' }, { target: 'prefs-layout', title: 'Layouts', text: 'Form style, result view, quick view and sidebar side.' }, { target: 'prefs-toast', title: 'Toasts', text: 'Position and duration of notifications.' }],
    default: [{ target: 'module', title: 'Modules', text: 'Switch module; the sidebar reloads with that module\'s menu.' }, { target: 'sidebar', title: 'Sidebar', text: 'Hover to expand, click the pin to keep it open. Three levels: section, group, page.' }, { target: 'profile', title: 'Profile', text: 'Settings, profile, preferences and sign out.' }]
  };

  const SHORTCUTS = [['Ctrl / ⌘ + K', 'Command palette'], ['/', 'Focus search'], ['Alt + N', 'New record'], ['Ctrl / ⌘ + S', 'Save form'], ['Alt + P', 'Pin / unpin sidebar'], ['Alt + 1…5', 'Switch module'], ['Alt + ←/→', 'Previous / next tab'], ['Ctrl + W', 'Close tab'], ['Esc', 'Close panel / dialog'], ['?', 'This list'], ['F1', 'Help panel']];

  const SHEET = [['Item', 'Qty', 'Unit cost', 'Tax %', 'Line total', 'Tax', 'Gross'], ['Basmati Rice 25kg', 40, 62.5, 5, '=B2*C2', '=E2*D2/100', '=E2+F2'], ['Olive Oil 5L', 12, 88, 5, '=B3*C3', '=E3*D3/100', '=E3+F3'], ['LED Panel 40W', 150, 34.9, 5, '=B4*C4', '=E4*D4/100', '=E4+F4'], ['Copper Wire 2.5mm', 300, 4.2, 5, '=B5*C5', '=E5*D5/100', '=E5+F5'], ['Office Chair', 25, 210, 5, '=B6*C6', '=E6*D6/100', '=E6+F6'], ['Total', '=SUM(B2:B6)', '', '', '=SUM(E2:E6)', '=SUM(F2:F6)', '=SUM(G2:G6)']];

  const DATA = { entities: E, modules: MODULES, dash: DASH, reports: REPORTS, notifications: NOTIFICATIONS, user: USER, themes: THEMES, fonts: FONTS, i18n: I18N, docs: DOCS, tours: TOURS, shortcuts: SHORTCUTS, sheet: SHEET, branches: BRANCHES, company: 'Halcyon Group', product: 'Vantage ERP', version: '2026.9.1' };
export default DATA as unknown as ErpData;
