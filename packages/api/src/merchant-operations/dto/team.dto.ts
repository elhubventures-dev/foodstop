import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const TEAM_ROLES = ['manager', 'kitchen', 'cashier'] as const;
const TEAM_STATUSES = ['invited', 'active', 'deactivated'] as const;

export class InviteTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn([...TEAM_ROLES])
  role!: (typeof TEAM_ROLES)[number];
}

export class PatchTeamMemberDto {
  @IsOptional()
  @IsString()
  @IsIn([...TEAM_ROLES])
  role?: (typeof TEAM_ROLES)[number];

  @IsOptional()
  @IsString()
  @IsIn([...TEAM_STATUSES])
  status?: (typeof TEAM_STATUSES)[number];
}
