import { Injectable, inject } from '@angular/core';
import { Engineer } from '../interfaces/engineer';
import { MARAQI_DATA_PROVIDER } from '../data-access/data-provider.token';

@Injectable({ providedIn: 'root' })
export class EngineersService {
  private readonly provider = inject(MARAQI_DATA_PROVIDER);

  getAll() { return this.provider.engineers.getAll(); }
  getById(id: string) { return this.provider.engineers.getById(id); }
  create(payload: Partial<Engineer>) { return this.provider.engineers.create(payload); }
  update(id: string, payload: Partial<Engineer>) { return this.provider.engineers.update(id, payload); }
  delete(id: string) { return this.provider.engineers.delete(id); }
}