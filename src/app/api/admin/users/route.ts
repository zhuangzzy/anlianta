import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 管理员 API - 查看所有用户信息
export async function GET(_request: NextRequest) {
  try {
    // 使用 service_role 来绕过 RLS，查看所有数据
    const supabase = getSupabaseClient();

    // 获取所有用户
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { error: `获取用户列表失败: ${profilesError.message}` },
        { status: 500 }
      );
    }

    // 获取每个用户的暗恋列表和匹配数量
    const profilesWithStats = await Promise.all(
      (profiles || []).map(async (profile: { user_id: string; real_name: string; birth_date: string | null; birth_place: string | null; current_location: string | null; created_at: string; updated_at: string | null }) => {
        const { data: crushes } = await supabase
          .from('crushes')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false });

        const { count: matchesCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .or(`user1_id.eq.${profile.user_id},user2_id.eq.${profile.user_id}`);

        return {
          ...profile,
          crushes: crushes || [],
          crushes_count: crushes?.length || 0,
          matches_count: matchesCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: profilesWithStats,
      total: profiles?.length || 0,
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
