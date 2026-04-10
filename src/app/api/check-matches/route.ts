import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 计算两个用户的相似度评分
function calculateSimilarity(
  crush: { birth_date: string | null; birth_place: string | null; current_location: string | null },
  profile: { birth_date: string | null; birth_place: string | null; current_location: string | null }
): number {
  let score = 0;

  // 出生年月匹配（权重最高）
  if (crush.birth_date && profile.birth_date) {
    const crushDate = new Date(crush.birth_date).getTime();
    const profileDate = new Date(profile.birth_date).getTime();
    const daysDiff = Math.abs(crushDate - profileDate) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 1) {
      score += 10; // 同一天或相差一天，高分
    } else if (daysDiff <= 7) {
      score += 5; // 一周内
    } else if (daysDiff <= 30) {
      score += 2; // 一月内
    }
  }

  // 出生地匹配
  if (crush.birth_place && profile.birth_place) {
    if (crush.birth_place === profile.birth_place) {
      score += 5; // 完全相同
    } else if (crush.birth_place.includes(profile.birth_place) || profile.birth_place.includes(crush.birth_place)) {
      score += 2; // 部分匹配（如"北京市"和"北京"）
    }
  }

  // 所在地匹配
  if (crush.current_location && profile.current_location) {
    if (crush.current_location === profile.current_location) {
      score += 5; // 完全相同
    } else if (crush.current_location.includes(profile.current_location) || profile.current_location.includes(crush.current_location)) {
      score += 2; // 部分匹配
    }
  }

  return score;
}

// 查找最匹配的用户
async function findBestMatch(
  supabase: ReturnType<typeof getSupabaseClient>,
  crushName: string,
  crushDetails: { birth_date: string | null; birth_place: string | null; current_location: string | null }
): Promise<{ user_id: string; real_name: string; similarity: number } | null> {
  // 查找所有同名的用户
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('real_name', crushName);

  if (error || !profiles || profiles.length === 0) {
    return null;
  }

  // 只有一个同名用户，直接返回
  if (profiles.length === 1) {
    return {
      user_id: profiles[0].user_id,
      real_name: profiles[0].real_name,
      similarity: 0,
    };
  }

  // 多个同名用户，计算相似度
  let bestMatch: { user_id: string; real_name: string; similarity: number } | null = null;

  for (const profile of profiles) {
    const similarity = calculateSimilarity(crushDetails, profile);

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = {
        user_id: profile.user_id,
        real_name: profile.real_name,
        similarity,
      };
    }
  }

  return bestMatch;
}

// 手动触发匹配检测（用于测试和修复）
export async function POST(_request: NextRequest) {
  try {
    // 使用 service_role 来绕过 RLS，进行全局匹配检测
    const supabase = getSupabaseClient();

    // 获取所有用户
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      return NextResponse.json(
        { error: `获取用户列表失败: ${profilesError.message}` },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: '没有用户', matches: [] });
    }

    interface Match {
      user1: string;
      user2: string;
      match: {
        id: string;
        user1_id: string;
        user2_id: string;
        matched_at: string;
        is_notified: boolean;
      };
      similarity?: number;
    }

    const matches: Match[] = [];

    // 检查每一对用户的相互暗恋
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const user1 = profiles[i];
        const user2 = profiles[j];

        // 获取 user1 的所有暗恋
        const { data: user1Crushes } = await supabase
          .from('crushes')
          .select('*')
          .eq('user_id', user1.user_id);

        if (!user1Crushes) continue;

        // 检查 user1 的每个暗恋对象
        for (const crush1 of user1Crushes) {
          // 查找最匹配的用户
          const matchedUser1 = await findBestMatch(
            supabase,
            crush1.crush_name,
            {
              birth_date: crush1.birth_date,
              birth_place: crush1.birth_place,
              current_location: crush1.current_location,
            }
          );

          // 如果找到匹配，且匹配的是 user2
          if (matchedUser1 && matchedUser1.user_id === user2.user_id) {
            // 检查 user2 是否也暗恋 user1
            const { data: user2Crushes } = await supabase
              .from('crushes')
              .select('*')
              .eq('user_id', user2.user_id);

            if (!user2Crushes) continue;

            for (const crush2 of user2Crushes) {
              const matchedUser2 = await findBestMatch(
                supabase,
                crush2.crush_name,
                {
                  birth_date: crush2.birth_date,
                  birth_place: crush2.birth_place,
                  current_location: crush2.current_location,
                }
              );

              // 如果 user2 也匹配到 user1
              if (matchedUser2 && matchedUser2.user_id === user1.user_id) {
                // 检查是否已经存在匹配
                const { data: existingMatch } = await supabase
                  .from('matches')
                  .select('*')
                  .or(`user1_id.eq.${user1.user_id},user2_id.eq.${user1.user_id}`)
                  .or(`user1_id.eq.${user2.user_id},user2_id.eq.${user2.user_id}`)
                  .maybeSingle();

                if (!existingMatch) {
                  // 创建匹配
                  const { data: newMatch } = await supabase
                    .from('matches')
                    .insert({
                      user1_id: user1.user_id,
                      user2_id: user2.user_id,
                    })
                    .select()
                    .single();

                  matches.push({
                    user1: user1.real_name,
                    user2: user2.real_name,
                    match: newMatch,
                    similarity: matchedUser1.similarity + matchedUser2.similarity,
                  });
                }
                break;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `匹配检测完成，发现 ${matches.length} 对新匹配`,
      matches,
    });
  } catch (error) {
    console.error('Check matches error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
