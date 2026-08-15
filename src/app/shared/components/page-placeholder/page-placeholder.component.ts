import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-placeholder',
  imports: [MatIcon],
  templateUrl: './page-placeholder.component.html',
  styleUrl: './page-placeholder.component.css',
})
export class PagePlaceholderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly title = signal('Módulo');
  readonly icon = signal('construction');

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.title.set((data['title'] as string | undefined) ?? 'Módulo');
    this.icon.set((data['icon'] as string | undefined) ?? 'construction');
  }
}
