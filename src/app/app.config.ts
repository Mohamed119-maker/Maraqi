import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { MARAQI_DATA_PROVIDER } from './data-access/data-provider.token';
import { HttpDataProvider } from './data-access/http-data.provider';
import { MockDataProvider } from './data-access/mock-data.provider';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MARAQI_DATA_PROVIDER, useClass: environment.useMockData ? MockDataProvider : HttpDataProvider },
  ]
};
