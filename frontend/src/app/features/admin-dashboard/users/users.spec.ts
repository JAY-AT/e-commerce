import { TestBed } from '@angular/core/testing';
import { AdminUsersComponent } from './users';

describe('AdminUsersComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should filter by name, email, and role', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    const component = fixture.componentInstance;

    const users = [
      { id: '1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', role: 'customer' },
      { id: '2', first_name: 'John', last_name: 'Admin', email: 'admin@example.com', role: 'admin' },
    ] as any;

    expect(component.filterUsers(users, 'jane')).toHaveLength(1);
    expect(component.filterUsers(users, 'admin@example.com')).toHaveLength(1);
    expect(component.filterUsers(users, 'admin')).toHaveLength(1);
    expect(component.filterUsers(users, 'nobody')).toHaveLength(0);
  });
});
