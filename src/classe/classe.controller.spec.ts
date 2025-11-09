import { Test, TestingModule } from '@nestjs/testing';
import { ClasseController } from './classe.controller';

describe('ClasseController', () => {
  let controller: ClasseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClasseController],
    }).compile();

    controller = module.get<ClasseController>(ClasseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
