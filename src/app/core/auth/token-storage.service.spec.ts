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
    expect(service.accessTokenExpiresAt).toBeNull();
  });

  it('guarda y lee el access token', () => {
    service.accessToken = 'abc-123';
    expect(service.accessToken).toBe('abc-123');
  });

  it('guarda y lee la expiración del token', () => {
    const expiresAt = Date.now() + 900_000;
    service.accessTokenExpiresAt = expiresAt;
    expect(service.accessTokenExpiresAt).toBe(expiresAt);
  });

  it('clear elimina token y expiración', () => {
    service.accessToken = 'abc-123';
    service.accessTokenExpiresAt = Date.now() + 900_000;
    service.clear();
    expect(service.accessToken).toBeNull();
    expect(service.accessTokenExpiresAt).toBeNull();
  });
});
