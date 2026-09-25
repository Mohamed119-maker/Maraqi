import { Injectable, inject } from '@angular/core';
import { Need } from '../interfaces/need';
import { MARAQI_DATA_PROVIDER } from '../data-access/data-provider.token';

@Injectable({ providedIn: 'root' })
export class NeedsService {
  private readonly provider = inject(MARAQI_DATA_PROVIDER);

  getAll() { return this.provider.needs.getAll(); }
  getById(id: string) { return this.provider.needs.getById(id); }
  create(payload: Partial<Need>) { return this.provider.needs.create(payload); }
  update(id: string, payload: Partial<Need>) { return this.provider.needs.update(id, payload); }
  delete(id: string) { return this.provider.needs.delete(id); }
}