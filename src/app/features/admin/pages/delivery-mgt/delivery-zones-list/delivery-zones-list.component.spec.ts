import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryZonesListComponent } from './delivery-zones-list.component';

describe('DeliveryZonesListComponent', () => {
  let component: DeliveryZonesListComponent;
  let fixture: ComponentFixture<DeliveryZonesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryZonesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryZonesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
