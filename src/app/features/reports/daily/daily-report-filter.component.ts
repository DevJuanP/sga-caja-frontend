import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReportDownloaderComponent } from '../report-downloader/report-downloader.component';

@Component({
  selector: 'app-daily-report-filter',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, ReportDownloaderComponent],
  templateUrl: './daily-report-filter.component.html',
  styleUrl: './daily-report-filter.component.css',
})
export class DailyReportFilterComponent {
  readonly today = new Date().toISOString().split('T')[0];

  readonly form = new FormGroup({
    date: new FormControl<string>(this.today, Validators.required),
  });
}
