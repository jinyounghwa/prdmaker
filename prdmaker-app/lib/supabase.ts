import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
});

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// API 키 관련 함수
export async function saveApiKey(userId: string, provider: string, apiKey: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .insert([
      { user_id: userId, provider, api_key: apiKey }
    ]);
  
  return { data, error };
}

export async function deleteIntegration(userId: string, service: string) {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .match({ user_id: userId, service: service });
  
  return { error };
}

export async function getApiKey(userId: string, provider: string) {
  // Supabase 클라이언트 대신 기본 옵션으로 다시 시도
  try {
    // 기본 Supabase 클라이언트 사용, expires_at 조건 제거
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    // 결과가 배열로 반환되므로 첫 번째 항목 가져오기
    const apiKey = data && data.length > 0 ? data[0] : null;
    
    return { data: apiKey, error: null };
  } catch (error) {
    console.error('API 키 가져오기 오류:', error);
    
    // 오류 발생 시 대체 방법 시도 - 직접 fetch 사용
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/api_keys?select=*&user_id=eq.${userId}&provider=eq.${provider}&order=created_at.desc&limit=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'return=representation'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API 키 가져오기 오류: ${response.status} ${response.statusText}`);
      }
      
      const results = await response.json();
      const apiKey = results.length > 0 ? results[0] : null;
      
      return { data: apiKey, error: null };
    } catch (fetchError) {
      console.error('API 키 가져오기 대체 방법 오류:', fetchError);
      return { data: null, error: fetchError };
    }
  }
}

// 프로젝트 관련 함수
export async function createProject(userId: string, name: string, description: string = '') {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      { user_id: userId, name, description }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function getProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

// PRD 문서 관련 함수
export async function savePrdDocument(projectId: string, content: string) {
  const { data, error } = await supabase
    .from('prd_documents')
    .insert([
      { project_id: projectId, content }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function getPrdDocument(projectId: string) {
  const { data, error } = await supabase
    .from('prd_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
}

// 기능 및 태스크 관련 함수
export async function saveFeatures(projectId: string, features: any[]) {
  const { data, error } = await supabase
    .from('features')
    .insert(
      features.map(feature => ({
        project_id: projectId,
        name: feature.기능_이름 || feature.name,
        description: feature.기능_설명 || feature.description,
        api_endpoint: feature.API_Endpoint || feature.api_endpoint,
        priority: feature.우선순위 || feature.priority,
        related_pages: feature.관련_페이지 || feature.related_pages
      }))
    )
    .select();
  
  return { data, error };
}

export async function getFeatures(projectId: string) {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('project_id', projectId);
  
  return { data, error };
}

export async function saveTasks(featureId: string, tasks: any[]) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(
      tasks.map(task => ({
        feature_id: featureId,
        name: task.작업_내용 || task.task,
        assignee: task.담당자 || task.assignee,
        status: task.상태 || task.status || 'pending',
        estimated_hours: task.예상_소요_시간 || task.estimated_hours,
        priority: task.우선순위 || task.priority
      }))
    )
    .select();
  
  return { data, error };
}

export async function getTasks(featureId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('feature_id', featureId);
  
  return { data, error };
}

// 생성된 문서 관련 함수
export async function saveGeneratedDocument(projectId: string, type: string, content: string) {
  const { data, error } = await supabase
    .from('generated_documents')
    .insert([
      { project_id: projectId, type, content }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function getGeneratedDocument(projectId: string, type: string) {
  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
}

// 외부 서비스 연동 관련 함수
export async function saveIntegration(userId: string, service: string, apiKey: string, serviceUrl?: string, projectKey?: string) {
  const { data, error } = await supabase
    .from('integrations')
    .insert([
      { user_id: userId, service, api_key: apiKey, service_url: serviceUrl, project_key: projectKey }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function getIntegration(userId: string, service: string) {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service', service)
    .single();
  
  return { data, error };
}
