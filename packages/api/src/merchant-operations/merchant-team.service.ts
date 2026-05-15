import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';
import { InviteTeamMemberDto, PatchTeamMemberDto } from './dto/team.dto';

@Injectable()
export class MerchantTeamService {
  constructor(private readonly supabase: SupabaseService) {}

  async listMembers(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('merchant_team_members')
      .select(
        'id, email, role, status, user_id, invited_at, joined_at',
      )
      .eq('merchant_id', merchantId)
      .order('invited_at', { ascending: false });
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async invite(merchantId: string, dto: InviteTeamMemberDto): Promise<unknown> {
    const email = dto.email.trim().toLowerCase();
    const { data, error } = await this.supabase.db
      .from('merchant_team_members')
      .insert({
        merchant_id: merchantId,
        email,
        role: dto.role,
        status: 'invited',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('That email is already on your team list.');
      }
      throw new ConflictException(error.message);
    }
    return data;
  }

  async patchMember(
    merchantId: string,
    memberId: string,
    dto: PatchTeamMemberDto,
  ): Promise<unknown> {
    await this.assertMember(merchantId, memberId);
    const patch: Record<string, unknown> = {};
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.status !== undefined) patch.status = dto.status;

    if (Object.keys(patch).length === 0) {
      throw new ConflictException('No changes.');
    }

    const { data, error } = await this.supabase.db
      .from('merchant_team_members')
      .update(patch)
      .eq('id', memberId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Update failed');
    }
    return data;
  }

  async removeMember(merchantId: string, memberId: string): Promise<void> {
    await this.assertMember(merchantId, memberId);
    const { error } = await this.supabase.db
      .from('merchant_team_members')
      .delete()
      .eq('id', memberId)
      .eq('merchant_id', merchantId);
    if (error) {
      throw new ConflictException(error.message);
    }
  }

  private async assertMember(
    merchantId: string,
    memberId: string,
  ): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('merchant_team_members')
      .select('id')
      .eq('id', memberId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Team member not found.');
    }
  }
}
