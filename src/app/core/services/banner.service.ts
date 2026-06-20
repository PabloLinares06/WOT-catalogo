import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BannerConfig {
  desktopUrl: string;
  mobileUrl: string;
  updatedAt?: string;
}

interface ApiBanner {
  id: number;
  desktopUrl: string;
  mobileUrl: string;
}

@Injectable({ providedIn: 'root' })
export class BannerService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Trackea el id del banner activo para saber si hacer POST o PATCH */
  private activeBannerId$ = new BehaviorSubject<number | null>(null);

  getBanners(): Observable<BannerConfig> {
    return this.http.get<ApiBanner[]>(`${this.apiUrl}/api/banners`).pipe(
      tap(banners => {
        if (banners.length > 0) {
          this.activeBannerId$.next(banners[0].id);
        } else {
          this.activeBannerId$.next(null);
        }
      }),
      map(banners =>
        banners.length > 0
          ? { desktopUrl: banners[0].desktopUrl, mobileUrl: banners[0].mobileUrl }
          : { desktopUrl: '', mobileUrl: '' }
      ),
      catchError(() => of({ desktopUrl: '', mobileUrl: '' }))
    );
  }

  async saveBanners(config: BannerConfig): Promise<void> {
    const existingId = this.activeBannerId$.getValue();
    if (existingId !== null) {
      await firstValueFrom(
        this.http.patch<ApiBanner>(`${this.apiUrl}/api/banners/${existingId}`, config)
      );
    } else {
      const created = await firstValueFrom(
        this.http.post<ApiBanner>(`${this.apiUrl}/api/banners`, config)
      );
      this.activeBannerId$.next(created.id);
    }
  }

  async uploadBannerImage(file: File, type: 'desktop' | 'mobile'): Promise<string> {
    const reference = `banner-${type}-${Date.now()}`;
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('reference', reference);

    const response = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.apiUrl}/api/upload/image`, formData)
    );
    return response.url;
  }
}
