import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// OpenAI API 사용
export async function callOpenAI(apiKey: string, prompt: string, systemPrompt: string) {
  const openai = new OpenAI({ apiKey });
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });
    
    return { 
      data: response.choices[0].message.content,
      error: null 
    };
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return { 
      data: null, 
      error: '오류가 발생했습니다. API 키를 확인하거나 나중에 다시 시도해주세요.' 
    };
  }
}

// Google AI API 사용
export async function callGoogleAI(apiKey: string, prompt: string, systemPrompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // 최신 Gemini 모델 사용 (gemini-1.5-pro 또는 gemini-1.0-pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // 시스템 프롬프트와 사용자 프롬프트를 하나의 채팅 세션으로 구성
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: '이해했습니다. 요청하신 작업을 수행하겠습니다.' }],
        },
      ],
    });
    
    // 사용자 프롬프트 전송
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    return { 
      data: response.text(),
      error: null 
    };
  } catch (error) {
    console.error('Google AI API 오류:', error);
    
    // 모델을 찾을 수 없는 경우 대체 모델 시도
    if (error instanceof Error && error.message.includes('models/gemini-1.5-pro is not found')) {
      try {
        // 대체 모델로 시도
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        // 단일 프롬프트로 시도
        const combinedPrompt = `${systemPrompt}\n\n${prompt}`;
        const result = await model.generateContent(combinedPrompt);
        const response = await result.response;
        
        return {
          data: response.text(),
          error: null
        };
      } catch (fallbackError) {
        console.error('대체 모델 시도 실패:', fallbackError);
        return { 
          data: null, 
          error: 'Google AI API 연결에 실패했습니다. API 키를 확인하거나 나중에 다시 시도해주세요.' 
        };
      }
    }
    
    return { 
      data: null, 
      error: '오류가 발생했습니다. API 키를 확인하거나 나중에 다시 시도해주세요.' 
    };
  }
}

// PRD 분석을 위한 시스템 프롬프트
export const PRD_ANALYSIS_PROMPT = `
당신은 PRD(제품 요구사항 문서)를 분석하고 구조화된 형식으로 기능을 추출하는 AI 어시스턴트입니다.
사용자가 제공하는 PRD 텍스트에서 다음 정보를 추출해주세요:

1. 각 기능에 대해 다음 정보를 JSON 형식으로 추출하세요:
   - 기능 이름
   - 기능 설명
   - API Endpoint (RESTful 형식으로)
   - 요청 파라미터 (있는 경우)
   - 우선순위 (높음, 중간, 낮음)
   - 관련 페이지 (있는 경우)

2. 응답은 다음 형식의 JSON 배열로 제공해주세요:
[
  {
    "기능_이름": "...",
    "기능_설명": "...",
    "API_Endpoint": "...",
    "요청_파라미터": { ... },
    "우선순위": "...",
    "관련_페이지": "..."
  },
  ...
]

3. 기능이 명확하지 않은 경우, 합리적인 추측을 해주세요.
4. 응답은 JSON 형식만 포함해야 합니다. 다른 설명이나 텍스트는 포함하지 마세요.
`;

// 태스크 테이블 생성을 위한 시스템 프롬프트
export const TASK_TABLE_PROMPT = `
당신은 소프트웨어 개발 프로젝트 관리자입니다. 
제공된 기능 목록을 바탕으로 개발 태스크 테이블을 생성해주세요.

각 기능에 대해 다음 정보를 포함한 태스크 목록을 JSON 형식으로 생성해주세요:
- task: 작업 내용 (구체적인 개발 작업)
- feature_id: 관련된 기능 ID
- estimated_hours: 예상 소요 시간 (시간 단위)
- status: 상태 (대기, 진행 중, 완료 중 하나)

응답은 다음 형식의 JSON 배열로 제공해주세요:
[
  {
    "task": "...",
    "feature_id": "...",
    "estimated_hours": 숫자,
    "status": "대기"
  },
  ...
]

각 기능에 대해 최소 2개 이상의 태스크를 생성해주세요.
응답은 JSON 형식만 포함해야 합니다. 다른 설명이나 텍스트는 포함하지 마세요.
`;

// 함수 맵 생성을 위한 시스템 프롬프트
export const FUNCTION_MAP_PROMPT = `
당신은 소프트웨어 아키텍트입니다.
제공된 기능 목록을 바탕으로 필요한 함수들의 맵을 생성해주세요.

각 기능에 대해 필요한 함수들을 다음 정보를 포함하여 마크다운 형식으로 생성해주세요:
- 함수명
- 파라미터
- 반환값
- 간단한 설명

다음과 같은 형식으로 응답해주세요:

## 기능: [기능명]

### 프론트엔드 함수

\`\`\`typescript
// 함수 설명
function 함수명(파라미터1: 타입, 파라미터2: 타입): 반환타입 {
  // 구현 설명
}
\`\`\`

### 백엔드 함수

\`\`\`typescript
// 함수 설명
function 함수명(파라미터1: 타입, 파라미터2: 타입): 반환타입 {
  // 구현 설명
}
\`\`\`

각 기능에 대해 프론트엔드와 백엔드 함수를 모두 포함해주세요.
`;

// 개발 트리 생성을 위한 시스템 프롬프트
export const DEV_TREE_PROMPT = `
당신은 소프트웨어 아키텍트입니다.
제공된 기능 목록을 바탕으로 개발 기술 스택과 파일 구조를 포함한 개발 트리를 생성해주세요.

다음 정보를 포함한 마크다운 형식으로 응답해주세요:

## 기술 스택

### 프론트엔드
- Next.js
- React
- Tailwind CSS
- 기타 필요한 라이브러리

### 백엔드
- Supabase
- 기타 필요한 서비스

## 파일 구조

\`\`\`
/app
  /api
    /auth
    /projects
    /features
    /tasks
  /auth
    /login
    /register
  /dashboard
  /prompt
/components
  /ui
  /forms
  /layouts
/lib
  /supabase
  /ai-service
/public
\`\`\`

## 개발 로드맵

1. 초기 설정 및 인증 구현
2. 기본 UI 컴포넌트 개발
3. API 연동 구현
4. 기능별 개발 순서
   - 기능 1
   - 기능 2
   ...

상세하고 실용적인 개발 트리를 제공해주세요.
`;

// 시스템 구성 생성을 위한 시스템 프롬프트
export const SYSTEM_CONFIG_PROMPT = `
당신은 시스템 아키텍트입니다.
제공된 기능 목록을 바탕으로 전체 시스템 구성도를 생성해주세요.

다음 정보를 포함한 마크다운 형식으로 응답해주세요:

## 시스템 아키텍처

### 컴포넌트 다이어그램
(텍스트로 다이어그램 표현)

### 데이터 흐름
1. 사용자 인증
2. PRD 입력 및 분석
3. 기능 추출 및 태스크 생성
4. 문서 생성
5. 외부 서비스 연동

## 데이터베이스 스키마

### 테이블 구조
- users
- projects
- features
- tasks
- documents
- integrations

## 배포 구성

### 개발 환경
- 로컬 개발 설정

### 프로덕션 환경
- 배포 전략
- 스케일링 고려사항

상세하고 실용적인 시스템 구성을 제공해주세요.
`;

// 프롬프트 선택 함수
export function getSystemPrompt(type: string) {
  switch (type) {
    case 'prd_analysis':
      return PRD_ANALYSIS_PROMPT;
    case 'task_table':
      return TASK_TABLE_PROMPT;
    case 'function_map':
      return FUNCTION_MAP_PROMPT;
    case 'dev_tree':
      return DEV_TREE_PROMPT;
    case 'system_config':
      return SYSTEM_CONFIG_PROMPT;
    default:
      return PRD_ANALYSIS_PROMPT;
  }
}

// AI 서비스 호출 함수
export async function analyzeWithAI(apiKey: string, provider: string, prompt: string, type: string) {
  const systemPrompt = getSystemPrompt(type);
  
  if (provider === 'openai') {
    return await callOpenAI(apiKey, prompt, systemPrompt);
  } else if (provider === 'google') {
    return await callGoogleAI(apiKey, prompt, systemPrompt);
  } else {
    return { 
      data: null, 
      error: '지원하지 않는 AI 제공자입니다.' 
    };
  }
}
