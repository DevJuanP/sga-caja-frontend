import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { HttpParamsInput } from '../../interfaces/common.interface';

export interface ReportParams {
  date?: string;
  year?: number;
  month?: number;
}

export interface ReportResult {
  blob: Blob;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = inject(ApiService);

  private downloadReport(
    endpoint: string,
    params: ReportParams = {},
  ): Observable<ReportResult> {
    const queryParams: HttpParamsInput = {};
    if (params.date) {
      queryParams['date'] = params.date;
    }
    if (params.year !== undefined && params.year !== null) {
      queryParams['year'] = params.year;
    }
    if (params.month !== undefined && params.month !== null) {
      queryParams['month'] = params.month;
    }

    return this.api
      .download(`reports/${endpoint}`, queryParams)
      .pipe(
        map((response) => {
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = 'reporte.xlsx';
          if (contentDisposition) {
            const match = contentDisposition.match(
              /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
            );
            if (match && match[1]) {
              filename = match[1].replace(/['"]/g, '');
            }
          }
          return { blob: response.body!, filename };
        }),
      );
  }

  getDailyMovements(date?: string): Observable<ReportResult> {
    return this.downloadReport('movements/daily', { date });
  }

  getMonthlyMovements(year?: number, month?: number): Observable<ReportResult> {
    return this.downloadReport('movements/monthly', { year, month });
  }

  getTotalMovements(params: ReportParams): Observable<ReportResult> {
    const hasDate =
      params.date !== undefined && params.date !== null && params.date !== '';
    const hasYearMonth =
      params.year !== undefined &&
      params.year !== null &&
      params.month !== undefined &&
      params.month !== null;

    if (hasDate && hasYearMonth) {
      throw new Error(
        'No se puede especificar tanto date como year/month simultáneamente',
      );
    }
    if (!hasDate && !hasYearMonth) {
      throw new Error('Se debe especificar fecha o año/mes');
    }
    if (
      params.year !== undefined &&
      params.year !== null &&
      (params.month === undefined || params.month === null)
    ) {
      throw new Error('Si se especifica year, también debe especificarse month');
    }
    if (
      params.month !== undefined &&
      params.month !== null &&
      (params.year === undefined || params.year === null)
    ) {
      throw new Error('Si se especifica month, también debe especificarse year');
    }
    if (params.month !== undefined && params.month !== null && (params.month < 1 || params.month > 12)) {
      throw new Error('El mes debe estar entre 1 y 12');
    }

    return this.downloadReport('movements/totals', params);
  }

  getMembersReport(year?: number, month?: number): Observable<ReportResult> {
    return this.downloadReport('members', { year, month });
  }

  getNonMembersReport(year?: number, month?: number): Observable<ReportResult> {
    return this.downloadReport('non-members', { year, month });
  }

  getExpensesReport(year?: number, month?: number): Observable<ReportResult> {
    return this.downloadReport('expenses', { year, month });
  }

  getBanksReport(year?: number, month?: number): Observable<ReportResult> {
    return this.downloadReport('banks', { year, month });
  }
}
