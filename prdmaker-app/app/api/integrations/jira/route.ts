import { NextRequest, NextResponse } from 'next/server';
import { supabase, deleteIntegration } from '@/lib/supabase';

// Jira API 호출 함수
async function callJiraAPI(apiKey: string, domain: string, projectKey: string, data: any) {
  const url = `https://${domain}/rest/api/2/issue`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`admin:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '지라 API 호출 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Jira API 오류:', error);
    throw error;
  }
}

// 기능을 Jira 이슈로 변환
function convertFeatureToJiraIssue(feature: any, projectKey: string) {
  return {
    fields: {
      project: {
        key: projectKey
      },
      summary: feature.기능_이름 || feature.name,
      description: feature.기능_설명 || feature.description,
      issuetype: {
        name: 'Story'
      },
      priority: {
        name: getPriorityName(feature.우선순위 || feature.priority)
      },
      labels: ['PRD-Maker']
    }
  };
}

// 우선순위 변환
function getPriorityName(priority: string) {
  switch (priority?.toLowerCase()) {
    case '높음':
    case 'high':
      return 'High';
    case '중간':
    case 'medium':
      return 'Medium';
    case '낮음':
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { features, userId, apiKey, domain, projectKey } = await req.json();

    if (!features || !userId || !apiKey || !domain || !projectKey) {
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

    // 연동 정보 저장
    await supabase
      .from('integrations')
      .upsert([
        { 
          user_id: userId, 
          service: 'jira', 
          api_key: apiKey,
          service_url: domain,
          project_key: projectKey
        }
      ]);

    // 각 기능을 Jira 이슈로 변환하여 생성
    const results = [];
    
    for (const feature of features) {
      const issueData = convertFeatureToJiraIssue(feature, projectKey);
      const result = await callJiraAPI(apiKey, domain, projectKey, issueData);
      results.push(result);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Jira 연동 API 오류:', error);
    return NextResponse.json(
      { error: error.message || 'Jira 연동 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: '요청한 사용자와 인증된 사용자가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 연동 정보 삭제
    const { error } = await deleteIntegration(userId, 'jira');

    if (error) {
      console.error('Jira 연동 정보 삭제 오류:', error);
      return NextResponse.json(
        { error: 'Jira 연동 정보 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Jira 연동 삭제 API 오류:', error);
    return NextResponse.json(
      { error: error.message || 'Jira 연동 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
