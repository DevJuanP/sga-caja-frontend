import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CatalogFilter, FilterBarComponent } from './filter-bar.component';

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<FilterBarComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    fixture.detectChanges();
  });

  it('inicia con búsqueda vacía y estado "Todos"', () => {
    expect(fixture.componentInstance.searchControl.value).toBe('');
    expect(fixture.componentInstance.activeControl.value).toBe('all');
  });

  it('emite la búsqueda con debounce y el filtro de activos', async () => {
    const values: CatalogFilter[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => values.push(v));
    fixture.componentInstance.searchControl.setValue('  María  ');
    fixture.componentInstance.activeControl.setValue('true');

    await vi.waitFor(() => expect(values.at(-1)).toEqual({ search: 'María', active: 'true' }));
  });

  it('clear reinicia búsqueda y estado', async () => {
    fixture.componentInstance.searchControl.setValue('x');
    fixture.componentInstance.activeControl.setValue('false');
    await vi.waitFor(() => expect(fixture.componentInstance.activeControl.value).toBe('false'));

    fixture.componentInstance.clear();
    expect(fixture.componentInstance.searchControl.value).toBe('');
    expect(fixture.componentInstance.activeControl.value).toBe('all');
  });
});
