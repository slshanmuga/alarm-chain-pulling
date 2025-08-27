export interface FilterOptions {
  rpf_posts: string[];
  train_numbers: string[];
}

export interface TableResponse {
  data: any[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface KPIData {
  total_incidents: number;
  percentile?: number;
  daily_avg: number;
  monthly_trend: number[];
  daily_trend: number[];
}

export interface AnalyticsData {
  sections: Record<string, number>;
  coaches: Record<string, number>;
  reasons: Record<string, number>;
  time_analysis: Record<string, number>;
  mid_sections: Record<string, number>;
}

export interface DayAnalysisData {
  day_analysis: Record<string, number>;
}

export interface TimelineData {
  timeline: Array<{
    period: string;
    count: number;
    date: string;
  }>;
}