import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  it('inicia sin token', () => {
    expect(service.accessToken).toBeNull();
  });

  it('guarda y lee el access token', () => {
    service.accessToken = 'abc-123';
    expect(service.accessToken).toBe('abc-123');
  });

  it('clear elimina el token', () => {
    service.accessToken = 'abc-123';
    service.clear();
    expect(service.accessToken).toBeNull();
  });
});
