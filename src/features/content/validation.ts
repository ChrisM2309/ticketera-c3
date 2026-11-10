export type BlogPostInput = {
  title: string;
  slug: string;
  description?: string;
  bodyMd?: string;
  keyword?: string;
  topic?: string;
  relatedTypeSlugs?: string[];
};

type ValidationResult = { valid: true; data: BlogPostInput } | { valid: false; errors: Partial<Record<keyof BlogPostInput, string>> };

const topics = new Set(['eventos', 'cultura', 'fechas-mixtas']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function suggestSlug(title: string): string {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
}

export function validateBlogPost(input: unknown, mode: 'draft' | 'publish'): ValidationResult {
  const candidate = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const data: BlogPostInput = {
    title: stringValue(candidate.title),
    slug: stringValue(candidate.slug),
    description: stringValue(candidate.description),
    bodyMd: stringValue(candidate.bodyMd),
    keyword: stringValue(candidate.keyword),
    topic: stringValue(candidate.topic),
    relatedTypeSlugs: Array.isArray(candidate.relatedTypeSlugs) ? candidate.relatedTypeSlugs.filter((item): item is string => typeof item === 'string') : [],
  };
  const errors: Partial<Record<keyof BlogPostInput, string>> = {};
  if (data.title.length < 5 || data.title.length > 70) errors.title = 'El título debe tener entre 5 y 70 caracteres.';
  if (!slugPattern.test(data.slug) || data.slug === 'nuevo') errors.slug = 'El slug no es válido.';
  if (data.topic && !topics.has(data.topic)) errors.topic = 'El tema no es válido.';
  if (mode === 'publish') {
    if ((data.description ?? '').length < 50 || (data.description ?? '').length > 160) errors.description = 'La descripción debe tener entre 50 y 160 caracteres.';
    if ((data.bodyMd ?? '').length < 200 || (data.bodyMd ?? '').length > 20000) errors.bodyMd = 'El cuerpo debe tener entre 200 y 20000 caracteres.';
    if (!data.keyword) errors.keyword = 'La palabra clave es obligatoria al publicar.';
    if (!data.topic || !topics.has(data.topic)) errors.topic = 'El tema es obligatorio al publicar.';
  }
  return Object.keys(errors).length > 0 ? { valid: false, errors } : { valid: true, data };
}
