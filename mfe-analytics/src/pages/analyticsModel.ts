// Analytics query parameters and trend presentation.

/** Query for a time range; a custom range is only sent when both ends are chosen. */
export function analyticsParams(timeRange: string, customStart?: string, customEnd?: string): Record<string, string> {
  const params: Record<string, string> = { timeRange };
  if (timeRange === 'CUSTOM' && customStart && customEnd) {
    params.startDate = customStart;
    params.endDate = customEnd;
  }
  return params;
}

export type Trend = 'UP' | 'DOWN' | 'FLAT';

/** Whether a movement is good or bad; for inverted metrics (e.g. refunds) going down is good. */
export function trendTone(trend: Trend, invert = false): 'good' | 'bad' | 'neutral' {
  const isGood = invert ? trend === 'DOWN' : trend === 'UP';
  const isBad = invert ? trend === 'UP' : trend === 'DOWN';
  return isGood ? 'good' : isBad ? 'bad' : 'neutral';
}

export const TONE_COLORS = {
  good: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  bad: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  neutral: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' },
} as const;

export const deltaLabel = (delta: number) => `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
