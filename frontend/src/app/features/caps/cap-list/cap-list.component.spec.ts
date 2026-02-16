import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapListComponent } from './cap-list.component';

describe('CapListComponent', () => {
  let component: CapListComponent;
  let fixture: ComponentFixture<CapListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
