// CRM record form <-> API body mapping.

export type RecordRow = Record<string, any>;
export type Field = { key: string; label: string; type?: string; required?: boolean; options?: string[] };
export type Resource = { key: string; label: string; endpoint: string; fields: Field[]; title: (row: RecordRow) => string };

export function defaultForm(resource: Resource): Record<string, string> {
  return Object.fromEntries(resource.fields.map(field => [field.key, field.key === 'currency' ? ((globalThis as { sessionStorage?: Storage }).sessionStorage?.getItem('ucp.currency') || 'USD') : field.key === 'lifecycleStage' ? 'LEAD' : field.key === 'stage' ? 'Qualification' : field.key === 'priority' ? 'NORMAL' : field.key === 'probability' ? '10' : '']));
}

export function singular(key: string) {
  return ({ contacts: 'contact', companies: 'company', opportunities: 'opportunity', tasks: 'task', segments: 'segment' } as Record<string, string>)[key] || 'record';
}

export function formFromRow(resource: Resource, row: RecordRow) {
  const form: Record<string, string> = {};
  for (const field of resource.fields) {
    let value = row[field.key];
    if (resource.key === 'segments' && field.key === 'lifecycleStage') {
      try { value = JSON.parse(row.criteria || '{}').lifecycleStage || 'CUSTOMER'; } catch { value = 'CUSTOMER'; }
    }
    if (field.key === 'tags') {
      try { value = Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'); } catch { value = String(row.tags || '').split(','); }
      if (Array.isArray(value)) value = value.join(', ');
    }
    if (field.key === 'dueAt' && value) value = String(value).slice(0, 16);
    form[field.key] = value == null ? '' : String(value);
  }
  return form;
}

export function formToBody(resource: Resource, form: Record<string, string>) {
  const body: Record<string, any> = {};
  for (const field of resource.fields) {
    const raw = form[field.key]?.trim() || '';
    if (['amount', 'probability', 'contactId', 'companyId', 'opportunityId'].includes(field.key)) body[field.key] = raw ? Number(raw) : null;
    else if (field.key === 'tags') body.tags = raw.split(',').map(tag => tag.trim()).filter(Boolean);
    else if (field.type === 'datetime-local') body[field.key] = raw || null;
    else body[field.key] = raw || null;
  }
  if (resource.key === 'segments') body.criteria = { lifecycleStage: body.lifecycleStage || 'CUSTOMER' };
  delete body.lifecycleStage;
  return body;
}
