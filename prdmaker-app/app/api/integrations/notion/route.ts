import { NextRequest, NextResponse } from 'next/server';
import { supabase, deleteIntegration } from '@/lib/supabase';

// Notion API 호출 함수
async function callNotionAPI(apiKey: string, databaseId: string, data: any) {
  const url = `https://api.notion.com/v1/pages`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Notion API 호출 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Notion API 오류:', error);
    throw error;
  }
}

// 기능을 Notion 페이지로 변환
function convertFeatureToNotionPage(feature: any, databaseId: string) {
  return {
    parent: {
      database_id: databaseId
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: feature.기능_이름 || feature.name
            }
          }
        ]
      },
      Description: {
        rich_text: [
          {
            text: {
              content: feature.기능_설명 || feature.description
            }
          }
        ]
      },
      API: {
        rich_text: [
          {
            text: {
              content: feature.API_Endpoint || feature.api_endpoint || ''
            }
          }
        ]
      },
      Priority: {
        select: {
          name: feature.우선순위 || feature.priority || '중간'
        }
      },
      Status: {
        select: {
          name: '대기'
        }
      }
    },
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              text: {
                content: '기능 상세'
              }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: feature.기능_설명 || feature.description
              }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              text: {
                content: 'API 엔드포인트'
              }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'code',
        code: {
          language: 'plain',
          rich_text: [
            {
              text: {
                content: feature.API_Endpoint || feature.api_endpoint || 'N/A'
              }
            }
          ]
        }
      }
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { features, userId, apiKey, databaseId } = await req.json();

    if (!features || !userId || !apiKey || !databaseId) {
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
          service: 'notion', 
          api_key: apiKey,
          service_url: databaseId
        }
      ]);

    // 각 기능을 Notion 페이지로 변환하여 생성
    const results = [];
    
    for (const feature of features) {
      const pageData = convertFeatureToNotionPage(feature, databaseId);
      const result = await callNotionAPI(apiKey, databaseId, pageData);
      results.push(result);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Notion 연동 API 오류:', error);
    return NextResponse.json(
      { error: error.message || 'Notion 연동 중 오류가 발생했습니다.' },
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
    const { error } = await deleteIntegration(userId, 'notion');

    if (error) {
      console.error('Notion 연동 정보 삭제 오류:', error);
      return NextResponse.json(
        { error: 'Notion 연동 정보 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notion 연동 삭제 API 오류:', error);
    return NextResponse.json(
      { error: error.message || 'Notion 연동 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
