import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionGroupFormComponent } from './option-group-form.component';

describe('OptionGroupFormComponent', () => {
  let component: OptionGroupFormComponent;
  let fixture: ComponentFixture<OptionGroupFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionGroupFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionGroupFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
