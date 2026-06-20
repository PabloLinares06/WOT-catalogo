import { Component } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-6">
      <div class="text-center max-w-sm w-full">

        <!-- Logo -->
        <div class="mb-8 flex justify-center">
          <img src="/logo-wot-energy.png" alt="WOT Energy Logo" class="h-20 w-auto object-contain" />
        </div>

        <!-- Ícono herramienta -->
        <div class="w-20 h-20 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.655m5.965-3.17c-.676.18-1.322.5-1.88 1.006L9.5 9.5m5.965-3.17A3.5 3.5 0 1010.035 11.83"/>
          </svg>
        </div>

        <!-- Texto -->
        <h1 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">
          Estamos mejorando<br/>para ti 🚀
        </h1>
        <p class="text-gray-400 dark:text-gray-500 text-sm leading-relaxed mb-8">
          Nuestra tienda está en mantenimiento.<br/>
          Volvemos muy pronto con novedades.
        </p>

        <!-- Contacto WhatsApp -->
        <a href="https://wa.me/573127660414"
           target="_blank"
           class="inline-flex items-center gap-2.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all duration-200 shadow-sm shadow-green-200 dark:shadow-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contáctanos por WhatsApp
        </a>

      </div>
    </div>
  `
})
export class MaintenanceComponent {}
