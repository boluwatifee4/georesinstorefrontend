import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsMediaComponent } from './products-media.component';

describe('ProductsMediaComponent', () => {
  let component: ProductsMediaComponent;
  let fixture: ComponentFixture<ProductsMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsMediaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
