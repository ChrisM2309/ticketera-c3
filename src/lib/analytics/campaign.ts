const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
type CampaignKey = (typeof campaignKeys)[number];
export type Campaign = Partial<Record<CampaignKey, string>>;

export function parseCampaign(search: string): Campaign {
  const params = new URLSearchParams(search);
  const result: Campaign = {};
  for (const key of campaignKeys) {
    const value = params.get(key)?.trim();
    if (value && value.length <= 80 && /^[\p{L}\p{N} ._-]+$/u.test(value)) result[key] = value;
  }
  return result;
}

export function captureCampaign(search: string, storage: Storage): void {
  const campaign = parseCampaign(search);
  if (Object.keys(campaign).length) storage.setItem('ticketera_campaign', JSON.stringify(campaign));
}
