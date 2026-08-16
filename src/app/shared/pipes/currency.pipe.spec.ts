import { CurrencyPipe } from './currency.pipe';

describe('CurrencyPipe', () => {
  const pipe = new CurrencyPipe();

  it('formatea soles por defecto', () => {
    expect(pipe.transform(150)).toBe('S/ 150.00');
  });

  it('formata en la moneda indicada', () => {
    expect(pipe.transform(10.5, 'USD')).toBe('US$ 10.50');
  });

  it('devuelve una raya para valores nulos', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});
