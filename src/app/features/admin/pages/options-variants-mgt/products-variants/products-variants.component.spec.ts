import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsVariantsComponent } from './products-variants.component';

describe('ProductsVariantsComponent', () => {
  let component: ProductsVariantsComponent;
  let fixture: ComponentFixture<ProductsVariantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsVariantsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsVariantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
