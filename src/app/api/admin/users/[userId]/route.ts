import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 删除用户 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = getSupabaseClient();

    // 1. 删除该用户的匹配记录
    await supabase
      .from('matches')
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    // 2. 删除该用户的暗恋记录
    await supabase
      .from('crushes')
      .delete()
      .eq('user_id', userId);

    // 3. 删除该用户的档案
    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    // 4. 删除该用户的认证记录
    await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        error: '删除用户失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
