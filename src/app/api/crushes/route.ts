import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';
import { createClient } from '@supabase/supabase-js';

interface Crush {
  id: string;
  user_id: string;
  crush_name: string;
  birth_date: string | null;
  birth_place: string | null;
  current_location: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  real_name: string;
}

// 获取暗恋列表
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

    const { data, error } = await supabase
      .from('crushes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `获取暗恋列表失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      crushes: data || [],
    });
  } catch (error) {
    console.error('Get crushes error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 添加暗恋
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { crushName, birthDate, birthPlace, currentLocation } = body;

    if (!crushName || crushName.trim() === '') {
      return NextResponse.json(
        { error: '暗恋对象的姓名是必填项' },
        { status: 400 }
      );
    }

    // 添加暗恋
    const { data, error } = await supabase
      .from('crushes')
      .insert({
        user_id: user.id,
        crush_name: crushName.trim(),
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        current_location: currentLocation || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `添加暗恋失败: ${error.message}` },
        { status: 500 }
      );
    }

    // 检查是否有双向匹配
    await checkMatches(supabase, user.id);

    return NextResponse.json({
      success: true,
      crush: data,
    });
  } catch (error) {
    console.error('Add crush error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 检查是否有匹配
async function checkMatches(supabase: ReturnType<typeof getSupabaseClient>, userId: string) {
  // 使用服务端客户端，绕过 RLS 限制
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    console.error('Service role key not available, skipping match check');
    return;
  }

  const { url } = getSupabaseCredentials();
  const serviceClient = createClient(url, serviceRoleKey, {
    db: { timeout: 60000 },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 查找是否有其他用户也暗恋当前用户
  // 需要通过 real_name 来匹配
  const { data: userProfile } = await serviceClient
    .from('profiles')
    .select('real_name')
    .eq('user_id', userId)
    .single();

  if (!userProfile) {
    console.log(`User profile not found for userId: ${userId}`);
    return;
  }

  console.log(`Checking matches for user: ${userProfile.real_name} (${userId})`);

  // 查找暗恋当前用户的人
  const { data: mutualCrushes } = await serviceClient
    .from('crushes')
    .select('user_id')
    .eq('crush_name', userProfile.real_name);

  if (!mutualCrushes || mutualCrushes.length === 0) {
    console.log(`No users found who have a crush on ${userProfile.real_name}`);
    return;
  }

  console.log(`Found ${mutualCrushes.length} users who have a crush on ${userProfile.real_name}`);

  // 检查这些用户是否也被当前用户暗恋
  const { data: myCrushes } = await serviceClient
    .from('crushes')
    .select('*')
    .eq('user_id', userId);

  if (!myCrushes) {
    console.log(`No crushes found for user: ${userId}`);
    return;
  }

  console.log(`User ${userId} has ${myCrushes.length} crushes`);

  // 获取这些用户的名字
  const otherUserIds = mutualCrushes.map((c: { user_id: string }) => c.user_id);
  const { data: otherProfiles } = await serviceClient
    .from('profiles')
    .select('user_id, real_name')
    .in('user_id', otherUserIds);

  if (!otherProfiles) {
    console.log(`No profiles found for users: ${otherUserIds.join(', ')}`);
    return;
  }

  console.log(`Found ${otherProfiles.length} potential matches`);

  // 创建匹配
  for (const profile of otherProfiles as Profile[]) {
    const isMutual = myCrushes.some((c: Crush) =>
      c.crush_name === profile.real_name
    );

    if (isMutual) {
      console.log(`Found mutual match: ${userProfile.real_name} <-> ${profile.real_name}`);

      // 检查是否已经存在匹配
      const { data: existingMatch } = await serviceClient
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${profile.user_id}),and(user1_id.eq.${profile.user_id},user2_id.eq.${userId})`)
        .maybeSingle();

      console.log(`Checking match between ${userId} and ${profile.user_id}, existing: ${!!existingMatch}`);

      if (!existingMatch) {
        console.log(`Creating match between ${userId} and ${profile.user_id}`);
        await serviceClient
          .from('matches')
          .insert({
            user1_id: userId,
            user2_id: profile.user_id,
          });

        // 发送邮件通知（异步，不阻塞）
        sendMatchNotifications(serviceClient as ReturnType<typeof createClient>, userId, profile.user_id).catch(err =>
          console.error('Failed to send match notifications:', err)
        );
      } else {
        console.log(`Match already exists between ${userId} and ${profile.user_id}`);
      }
    }
  }
}

// 发送匹配通知邮件
async function sendMatchNotifications(
  serviceClient: ReturnType<typeof createClient>,
  userId1: string,
  userId2: string
) {
  try {
    // 动态导入邮件服务
    const { sendMatchNotification } = await import('@/lib/email');

    // 获取两个用户的详细信息
    const { data: profile1 } = await serviceClient
      .from('profiles')
      .select('real_name, birth_date, birth_place, current_location')
      .eq('user_id', userId1)
      .single();

    const { data: profile2 } = await serviceClient
      .from('profiles')
      .select('real_name, birth_date, birth_place, current_location')
      .eq('user_id', userId2)
      .single();

    const { data: auth1 } = await serviceClient.auth.admin.getUserById(userId1);
    const { data: auth2 } = await serviceClient.auth.admin.getUserById(userId2);

    // 发送邮件给用户1
    if (auth1.user?.email && profile1 && profile2) {
      await sendMatchNotification(
        auth1.user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile1 as any).real_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile2 as any).real_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile2 as any).birth_date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile2 as any).birth_place,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile2 as any).current_location
      );
    }

    // 发送邮件给用户2
    if (auth2.user?.email && profile2 && profile1) {
      await sendMatchNotification(
        auth2.user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile2 as any).real_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile1 as any).real_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile1 as any).birth_date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile1 as any).birth_place,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile1 as any).current_location
      );
    }
  } catch (error) {
    console.error('Failed to send match notifications:', error);
  }
}
