import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ADMIN_SECTION_ITEMS, AdminSection } from '../admin-dashboard.types';

@Component({
  selector: 'app-admin-command-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-command-center.html',
  styleUrl: './admin-command-center.scss',
})
export class AdminCommandCenterComponent {
  @Input() activeSection: AdminSection = 'analytics';
  @Output() sectionChange = new EventEmitter<AdminSection>();

  readonly sections = ADMIN_SECTION_ITEMS;

  // Trace point: selectSection()
  selectSection(section: AdminSection): void {
    this.sectionChange.emit(section);
  }
}
