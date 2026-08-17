import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CxcSummaryComponent } from './cxc-summary.component';

describe('CxcSummaryComponent', () => {
  let fixture: ComponentFixture<CxcSummaryComponent>;
  let httpMock: HttpTestingController;

  function setup(queryParams: Record<string, string>): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CxcSummaryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CxcSummaryComponent);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('carga resumen por memberUuid', () => {
    setup({ memberUuid: 'm1' });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/summary'),
    );
    expect(req.request.params.get('memberUuid')).toBe('m1');
    req.flush([
      {
        accountReceivable: {
          uuid: 'ar1',
          service: { uuid: 's1', name: 'Energía', consumptionBased: false },
          member: { uuid: 'm1', fullName: 'Juan Pérez' },
          stall: null,
          periodStartDate: '2026-08-01',
          periodEndDate: '2026-08-31',
          amount: 150,
          status: { uuid: 'st1', name: 'Paid' },
        },
        settlementMethod: 'PAYMENT',
        settledDate: '2026-08-15',
        receiptCorrelative: 1024,
      },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez');
  });

  it('carga resumen por stallUuid', () => {
    setup({ stallUuid: 'st1' });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/account-receivables/summary'),
    );
    expect(req.request.params.get('stallUuid')).toBe('st1');
    req.flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(0);
  });
});
