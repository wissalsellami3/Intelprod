import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapFormComponent } from './cap-form.component';

describe('CapFormComponent', () => {
  let component: CapFormComponent;
  let fixture: ComponentFixture<CapFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
