import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let service: MembersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MembersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista con búsqueda, estado y paginación', () => {
    service.list({ search: 'María', active: 'true', page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.params.get('search')).toBe('María');
    expect(req.request.params.get('active')).toBe('true');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('crea un socio con stageUuid', () => {
    service
      .create({
        code: 'S-001',
        firstName: 'María',
        lastName: 'Gómez',
        shareNumber: 'A-12',
        stageUuid: 'st1',
        birthDate: '1990-05-14',
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      code: 'S-001',
      firstName: 'María',
      lastName: 'Gómez',
      shareNumber: 'A-12',
      stageUuid: 'st1',
      birthDate: '1990-05-14',
    });
    req.flush({});
  });

  it('desactiva un socio', () => {
    service.deactivate('m1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/members/m1/deactivate'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
