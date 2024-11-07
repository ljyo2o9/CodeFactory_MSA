import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../user/entity/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IS_ISO31661_ALPHA_2 } from 'class-validator';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(configService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('parseBasicToken', () => {
    it('should return email and password', () => {
      const rawToken = 'Basic dGVzdEB0ZXN0LmNvbToxMjM0';
      const result = authService.parseBasicToken(rawToken);
      expect(result).toEqual({
        email: 'test@test.com',
        password: '1234',
      });
    });

    it('should throw BadReqeustException if basicSplitLength is not 2', () => {
      const rawToken = 'dGVzdEB0ZXN0LmNvbToxMjM0';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadReqeustException if basicSplitLength is not 2', () => {
      const rawToken = 'Bearer dGVzdEB0ZXN0LmNvbToxMjM0';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadReqeustException if basicSplitLength is not 2', () => {
      const rawToken = 'Basic a';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('register', () => {
    it('should create user and return user', async () => {
      const registerDto = {
        name: 'hi',
        age: 10,
        profile: "it's hi",
      };
      const email = 'test';
      const password = 'test';
      const user = {
        id: 'user_uuid',
        email,
        password,
        ...registerDto,
      };

      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(userService, 'create').mockResolvedValue(user as User);
      const result = await authService.register('testToken', registerDto);

      expect(authService.parseBasicToken).toHaveBeenCalledWith('testToken');
      expect(userService.create).toHaveBeenLastCalledWith({
        ...registerDto,
        email,
        password,
      });
      expect(result).toEqual(user);
    });
  });

  describe('issueToken', () => {
    it('should return accees token', async () => {
      const accessSecret = 'secret';
      const jwtToken = 'eyqdafsdfas';
      const isRefreshToken = false;
      const user = {
        id: 'test-id',
        sub: 'test-id',
        role: 1,
      };

      jest.spyOn(configService, 'getOrThrow').mockReturnValue(accessSecret);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(jwtToken);
      const result = await authService.issueToken(user, isRefreshToken);

      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'ACCESS_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id ?? user.sub,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessSecret,
          expiresIn: '3600h',
        },
      );
      expect(result).toEqual(jwtToken);
    });

    it('should return accees token and not have user id', async () => {
      const accessSecret = 'secret';
      const jwtToken = 'eyqdafsdfas';
      const isRefreshToken = false;
      const user = {
        id: null,
        sub: 'test-id',
        role: 1,
      };

      jest.spyOn(configService, 'getOrThrow').mockReturnValue(accessSecret);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(jwtToken);
      const result = await authService.issueToken(user, isRefreshToken);

      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'ACCESS_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id ?? user.sub,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessSecret,
          expiresIn: '3600h',
        },
      );
      expect(result).toEqual(jwtToken);
    });

    it('should return refresh token', async () => {
      const refreshSecret = 'secrett';
      const jwtToken = 'eyqdafsdfas';
      const isRefreshToken = true;
      const user = {
        id: 'test-id',
        sub: 'test-id',
        role: 1,
      };

      jest.spyOn(configService, 'getOrThrow').mockReturnValue(refreshSecret);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(jwtToken);
      const result = await authService.issueToken(user, isRefreshToken);

      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'REFRESH_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id ?? user.sub,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: refreshSecret,
          expiresIn: '3600h',
        },
      );
      expect(result).toEqual(jwtToken);
    });
  });

  describe('authenticate', () => {
    it('should return correct user', async () => {
      const email = 'test-eamil';
      const password = 'test-password';
      const user = {
        id: 'uuid',
        email,
        password,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);

      const result = await authService.authenticate(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(result).toEqual(user);
    });

    it('should throw BadRequestException if not found user', async () => {
      const email = 'test-eamil';
      const password = 'test-password';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = authService.authenticate(email, password);
      expect(result).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bcrypt is not compare', async () => {
      const email = 'test-eamil';
      const password = 'test-password';
      const user = {
        id: 'uuid',
        email,
        password,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);

      const result = authService.authenticate(email, password);

      expect(result).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return accessToken and refreshToken', async () => {
      const email = 'test-email';
      const password = 'test-pw';
      const rawToken = 'test-token';
      const user = {
        id: 'uuid',
        email,
        password,
      };

      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce('refreshToken');
      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce('accessToken');

      const result = await authService.login(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(email, password);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(result).toEqual({
        refreshToken: 'refreshToken',
        accessToken: 'accessToken',
      })
    });
  });
});
