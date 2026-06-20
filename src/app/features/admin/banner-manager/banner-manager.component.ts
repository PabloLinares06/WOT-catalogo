import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BannerService, BannerConfig } from '../../../core/services/banner.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-banner-manager',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './banner-manager.component.html'
})
export class BannerManagerComponent implements OnInit {
  bannerService = inject(BannerService);
  themeService = inject(ThemeService);

  desktopUrl = signal('');
  mobileUrl = signal('');
  desktopPreview = signal<string | null>(null);
  mobilePreview = signal<string | null>(null);
  saving = signal(false);
  saved = signal(false);
  error = signal('');
  loading = signal(true);
  uploadingDesktop = signal(false);
  uploadingMobile = signal(false);

  ngOnInit(): void {
    this.bannerService.getBanners().subscribe(config => {
      this.desktopUrl.set(config.desktopUrl || '');
      this.mobileUrl.set(config.mobileUrl || '');
      this.desktopPreview.set(config.desktopUrl || null);
      this.mobilePreview.set(config.mobileUrl || null);
      this.loading.set(false);
    });
  }

  onDesktopUrlChange(url: string): void {
    this.desktopUrl.set(url);
    this.desktopPreview.set(url.trim() || null);
  }

  onMobileUrlChange(url: string): void {
    this.mobileUrl.set(url);
    this.mobilePreview.set(url.trim() || null);
  }

  onDesktopError(): void {
    this.desktopPreview.set(null);
  }

  onMobileError(): void {
    this.mobilePreview.set(null);
  }

  async onDesktopFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen válida.');
      return;
    }

    this.uploadingDesktop.set(true);
    this.error.set('');
    try {
      const url = await this.bannerService.uploadBannerImage(file, 'desktop');
      this.desktopUrl.set(url);
      this.desktopPreview.set(url);
    } catch (err: any) {
      this.error.set(`Error al subir imagen: ${err.message || 'Intenta de nuevo'}`);
    } finally {
      this.uploadingDesktop.set(false);
      // Limpiamos el input para permitir subir el mismo archivo si es necesario
      input.value = '';
    }
  }

  async onMobileFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen válida.');
      return;
    }

    this.uploadingMobile.set(true);
    this.error.set('');
    try {
      const url = await this.bannerService.uploadBannerImage(file, 'mobile');
      this.mobileUrl.set(url);
      this.mobilePreview.set(url);
    } catch (err: any) {
      this.error.set(`Error al subir imagen: ${err.message || 'Intenta de nuevo'}`);
    } finally {
      this.uploadingMobile.set(false);
      // Limpiamos el input
      input.value = '';
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    try {
      const config: BannerConfig = {
        desktopUrl: this.desktopUrl().trim(),
        mobileUrl: this.mobileUrl().trim()
      };
      await this.bannerService.saveBanners(config);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch (err: any) {
      this.error.set(`Error al guardar los banners: ${err?.message || 'Intenta de nuevo.'}`);
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
