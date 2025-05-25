import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithAI } from '@/lib/ai-service';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { prompt, type, apiKey, provider, userId } = await req.json();

    if (!prompt || !type || !apiKey || !provider || !userId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // AI 분석 요청
    const { data, error } = await analyzeWithAI(apiKey, provider, prompt, type);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('AI 분석 API 오류:', error);
    return NextResponse.json(
      { error: error.message || 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
