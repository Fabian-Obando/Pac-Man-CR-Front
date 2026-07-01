import { TestBed } from '@angular/core/testing';

import { Skins } from './skins';

describe('Skins', () => {
  let service: Skins;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Skins);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
