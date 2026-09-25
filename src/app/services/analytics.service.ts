import { Injectable, inject } from '@angular/core';
import { MARAQI_DATA_PROVIDER } from '../data-access/data-provider.token';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly provider = inject(MARAQI_DATA_PROVIDER);

  getSummary() { return this.provider.analytics.getSummary(); }
}