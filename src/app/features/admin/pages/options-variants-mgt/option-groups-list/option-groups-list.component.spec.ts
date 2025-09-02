import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionGroupsListComponent } from './option-groups-list.component';

describe('OptionGroupsListComponent', () => {
  let component: OptionGroupsListComponent;
  let fixture: ComponentFixture<OptionGroupsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionGroupsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionGroupsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
