// Public projection: never spread CRM documents into a public response.
const fields = { title: 160, slug: 100, knifeType: 160, problem: 1800, workPerformed: 2400, result: 1800, location: 100, serviceDate: 10, beforeImage: 1500, afterImage: 1500 };
export function publicCase(value) {
  const data = Object.fromEntries(Object.entries(fields).map(([key, max]) => [key, String(value?.[key] || '').trim().slice(0, max)]));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error('Use a URL slug made of lowercase words separated by hyphens.');
  for (const key of ['title', 'knifeType', 'problem', 'workPerformed', 'result']) {
    if (!data[key]) throw new Error('Add a title, knife type, condition, work performed, and observed result before publishing.');
  }
  if (data.serviceDate && (!/^\d{4}-\d{2}-\d{2}$/.test(data.serviceDate) || new Date(data.serviceDate).toISOString().slice(0, 10) !== data.serviceDate)) throw new Error('Use a valid service date or leave it blank.');
  for (const key of ['beforeImage', 'afterImage']) {
    if (!data[key]) continue;
    const url = new globalThis.URL(data[key]);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Images need public HTTPS URLs without credentials, query strings, or fragments.');
  }
  return data;
}
export function approvedPublicCase(value) {
  if (value?.publicationConsent !== true || value?.publicationStatus !== 'published') return null;
  try { return publicCase(value); } catch { return null; }
}
