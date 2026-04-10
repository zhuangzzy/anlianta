import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  is_notified: boolean;
}

interface Profile {
  user_id: string;
  real_name: string;
  birth_date: string | null;
  birth_place: string | null;
  current_location: string | null;
}

interface MatchWithProfile extends Match {
  otherUser: Profile | null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    // 获取匹配列表
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('matched_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `获取匹配列表失败: ${error.message}` },
        { status: 500 }
      );
    }

    // 获取匹配用户的详细信息
    const matches = await Promise.all(
      (data || []).map(async (match: Match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', otherUserId)
          .single();

        const result: MatchWithProfile = {
          ...match,
          otherUser: otherProfile,
        };
        return result;
      })
    );

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
