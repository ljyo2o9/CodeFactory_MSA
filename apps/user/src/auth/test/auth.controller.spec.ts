import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
    expect(authService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should call register', () => {
      const token = 'test-token';
      const registerDto = {
        name: 'name',
        age: 10,
        profile: 'profile',
      };

      authController.registerUser(token, registerDto);
      expect(authService.register).toHaveBeenCalledWith(token, registerDto);
    });

    it('should throw UnauthorizedException if not have token', () => {
      const registerDto = {
        name: 'name',
        age: 10,
        profile: 'profile',
      };

      expect(() => authController.registerUser(null, registerDto)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginUser', () => {
    it('should call login', async () => {
      const token = 'test-token';
      await authController.loginUser(token);
      expect(authService.login).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException if not have token', () => {
      expect(() => authController.loginUser(null)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
