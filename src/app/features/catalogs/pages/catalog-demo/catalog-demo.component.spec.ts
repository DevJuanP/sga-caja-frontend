import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogDemoComponent } from './catalog-demo.component';

describe('CatalogDemoComponent', () => {
  let fixture: ComponentFixture<CatalogDemoComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CatalogDemoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CatalogDemoComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('muestra un select por cada catálogo', () => {
    const requests = httpMock.match((r) => r.method === 'GET');
    expect(requests.length).toBe(9);
    requests.forEach((req) => req.flush([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-catalog-select').length).toBe(9);
  });
});
