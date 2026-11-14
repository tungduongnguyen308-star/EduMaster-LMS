import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import {
  createRefreshToken,
  generateAccessToken,
  hashRefreshToken,
  refreshExpiresAt,
} from "../utils/token";

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function registerStudent(data: RegisterInput) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: "STUDENT",
    },
    select: publicUserSelect,
  });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) return null;

  // Kiểm tra cấu hình JWT truoc khi ghi token vao DB.
  const accessToken = generateAccessToken(user.id);
  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiresAt(),
    },
  });

  return {
    message: "Đăng nhập thành công",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUserProfile(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
}

export async function refreshUserToken(oldToken: string) {
  const oldHash = hashRefreshToken(oldToken);
  const now = new Date();

  // Atomic rotation: mot refresh token chi co the doi 1 lan.
  return prisma.$transaction(async (tx) => {
    const stored = await tx.refreshToken.findUnique({
      where: { tokenHash: oldHash },
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= now) return null;

    const updated = await tx.refreshToken.updateMany({
      where: {
        id: stored.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });
    if (updated.count !== 1) return null;

    const user = await tx.user.findUnique({
      where: { id: stored.userId },
      select: publicUserSelect,
    });
    if (!user) return null;

    const refreshToken = createRefreshToken();
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshExpiresAt(),
      },
    });

    return {
      message: "Cấp lại token thành công",
      accessToken: generateAccessToken(user.id),
      refreshToken,
      user,
    };
  });
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
