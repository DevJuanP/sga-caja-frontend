import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.css',
})
export class MainShellComponent {}
