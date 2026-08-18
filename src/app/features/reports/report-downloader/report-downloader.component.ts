import { Component, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReportsService, ReportParams } from '../reports.service';

@Component({
  selector: 'app-report-downloader',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './report-downloader.component.html',
  styleUrl: './report-downloader.component.css',
})
export class ReportDownloaderComponent {
  private readonly reportsService = inject(ReportsService);

  readonly reportType = input.required<
    'daily' | 'monthly' | 'total' | 'members' | 'non-members' | 'expenses' | 'banks'
  >();
  readonly params = input<ReportParams>({});
  readonly label = input<string>('Descargar reporte');

  readonly isDownloading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.params();
      this.error.set(null);
    });
  }

  download(): void {
    this.isDownloading.set(true);
    this.error.set(null);

    const reportType = this.reportType();
    const params = this.params();

    let request$;
    switch (reportType) {
      case 'daily':
        request$ = this.reportsService.getDailyMovements(params.date);
        break;
      case 'monthly':
        request$ = this.reportsService.getMonthlyMovements(params.year, params.month);
        break;
      case 'total':
        request$ = this.reportsService.getTotalMovements(params);
        break;
      case 'members':
        request$ = this.reportsService.getMembersReport(params.year, params.month);
        break;
      case 'non-members':
        request$ = this.reportsService.getNonMembersReport(params.year, params.month);
        break;
      case 'expenses':
        request$ = this.reportsService.getExpensesReport(params.year, params.month);
        break;
      case 'banks':
        request$ = this.reportsService.getBanksReport(params.year, params.month);
        break;
    }

    request$.subscribe({
      next: (result) => {
        const blobURL = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobURL);
        this.isDownloading.set(false);
      },
      error: (err) => {
        this.isDownloading.set(false);
        this.error.set(err.message || 'Error al descargar reporte');
      },
    });
  }
}
