import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = app.get<UserService>(UserService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('User Service Defined', () => {
    it('should defined', () => {
      expect(userService).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a user and return a user', async () => {
      const createUserDto = {
        email: 'email',
        password: 'pw',
        age: 10,
        name: 'Lee',
        profile: "it's humun",
      };
      const hashedPassword = 'asdfasdf';
      const user = {
        id: 'test-uuid',
        ...createUserDto,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user as User);
      jest.spyOn(bcrypt, 'hash').mockImplementation((a, b) => hashedPassword);
      const result = await userService.create(createUserDto);

      expect(userRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: 'email' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: 'email' },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(result).toEqual(user);
    });

    it('should throw BadRequest if already has user', async () => {
      const createUserDto = {
        email: 'email',
        password: 'pw',
        age: 10,
        name: 'Lee',
        profile: "it's humun",
      };
      const user = {
        id: 'test-uuid',
        ...createUserDto
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      const result = userService.create(createUserDto)

      expect(result).rejects.toThrow(BadRequestException)
    })
  });
});
