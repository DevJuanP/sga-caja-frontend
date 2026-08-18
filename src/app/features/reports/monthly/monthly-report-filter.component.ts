import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReportDownloaderComponent } from '../report-downloader/report-downloader.component';

@Component({
  selector: 'app-monthly-report-filter',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReportDownloaderComponent,
  ],
  templateUrl: './monthly-report-filter.component.html',
  styleUrl: './monthly-report-filter.component.css',
})
export class MonthlyReportFilterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly currentMonth = new Date().getMonth() + 1;

  readonly years = Array.from({ length: 11 }, (_, i) => this.currentYear - i);

  readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  readonly form = new FormGroup({
    year: new FormControl<number | null>(this.currentYear, Validators.required),
    month: new FormControl<number | null>(this.currentMonth, Validators.required),
  });
}
