import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DailyReportFilterComponent } from '../daily/daily-report-filter.component';
import { MonthlyReportFilterComponent } from '../monthly/monthly-report-filter.component';
import { TotalReportFilterComponent } from '../total/total-report-filter.component';
import { ReportDownloaderComponent } from '../report-downloader/report-downloader.component';

@Component({
  selector: 'app-reports-page',
  imports: [
    MatIconModule,
    PageHeaderComponent,
    DailyReportFilterComponent,
    MonthlyReportFilterComponent,
    TotalReportFilterComponent,
    ReportDownloaderComponent,
  ],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent {
  readonly currentYear = new Date().getFullYear();
  readonly currentMonth = new Date().getMonth() + 1;
}
