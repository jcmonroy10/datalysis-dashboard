export interface SalesRepository {
  getKpis(from: string, to: string, filters?: any): Promise<any>;

  getSalesByState(from: string, to: string, filters?: any): Promise<any>;

  getTopProducts(
    from: string,
    to: string,
    metric: string,
    limit: number,
    filters?: any
  ): Promise<any>;

  getRevenueTrend(from: string, to: string, grain: string, filters?: any): Promise<any>;

  getFilterOptions(): Promise<{
    states: any[];
    categories: any[];
    statuses: any[];
  }>;
}
