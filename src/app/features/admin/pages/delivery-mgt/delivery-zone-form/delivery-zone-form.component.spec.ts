import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryZoneFormComponent } from './delivery-zone-form.component';

describe('DeliveryZoneFormComponent', () => {
  let component: DeliveryZoneFormComponent;
  let fixture: ComponentFixture<DeliveryZoneFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryZoneFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryZoneFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
