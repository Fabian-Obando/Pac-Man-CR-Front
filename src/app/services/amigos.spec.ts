import { TestBed } from '@angular/core/testing';

import { Amigos } from './amigos';

describe('Amigos', () => {
  let service: Amigos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Amigos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
