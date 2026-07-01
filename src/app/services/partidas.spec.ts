import { TestBed } from '@angular/core/testing';

import { Partidas } from './partidas';

describe('Partidas', () => {
  let service: Partidas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Partidas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
