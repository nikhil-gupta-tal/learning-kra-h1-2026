import { User } from '@/database/entities/user.entity';

export function toUserResponse(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

export function toUserDetailResponse(user: User) {
  return {
    ...toUserResponse(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
