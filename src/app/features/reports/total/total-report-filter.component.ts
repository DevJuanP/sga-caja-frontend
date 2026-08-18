import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ReportDownloaderComponent } from '../report-downloader/report-downloader.component';

@Component({
  selector: 'app-total-report-filter',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    ReportDownloaderComponent,
  ],
  templateUrl: './total-report-filter.component.html',
  styleUrl: './total-report-filter.component.css',
})
export class TotalReportFilterComponent {
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
    option: new FormControl<'date' | 'month'>('date', Validators.required),
    date: new FormControl<string>(new Date().toISOString().split('T')[0]),
    year: new FormControl<number | null>(this.currentYear),
    month: new FormControl<number | null>(this.currentMonth),
  });

  get isByDate(): boolean {
    return this.form.value.option === 'date';
  }

  get downloadParams() {
    if (this.isByDate) {
      return { date: this.form.value.date ?? undefined };
    }
    return {
      year: this.form.value.year ?? undefined,
      month: this.form.value.month ?? undefined,
    };
  }
}
