'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, getUser, saveApiKey, getApiKey, savePrdDocument, saveFeatures, saveGeneratedDocument } from '@/lib/supabase';
import { analyzeWithAI } from '@/lib/ai-service';

export default function PromptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [provider, setProvider] = useState<'openai' | 'google'>('openai');
  const [providerError, setProviderError] = useState<string>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'saved' | 'error'>('none');
  const [prdText, setPrdText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'prd' | 'features' | 'tasks' | 'docs'>('prd');
  const [generatedDocs, setGeneratedDocs] = useState<{[key: string]: string}>({});
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      
      setUser(currentUser);
      
      // 프로젝트 ID가 없으면 대시보드로 리디렉션
      if (!projectId) {
        router.push('/dashboard');
        return;
      }
      
      // API 키 상태 확인
      const { data: openaiKey } = await getApiKey(currentUser.id, 'openai');
      const { data: googleKey } = await getApiKey(currentUser.id, 'google');
      
      if (openaiKey) {
        setProvider('openai');
        setApiKeyStatus('saved');
      } else if (googleKey) {
        setProvider('google');
        setApiKeyStatus('saved');
      }
      
      setLoading(false);
    };

    checkUser();
  }, [router, projectId]);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim() || !user) return;
    
    try {
      const { error } = await saveApiKey(user.id, provider, apiKeyInput);
      
      if (error) {
        throw error;
      }
      
      setApiKeyStatus('saved');
      setApiKeyInput('');
    } catch (error) {
      console.error('API 키 저장 오류:', error);
      setApiKeyStatus('error');
    }
  };

  const handleAnalyzePRD = async () => {
    if (!prdText.trim() || !user || !projectId) return;
    
    setAnalyzing(true);
    
    try {
      // PRD 문서 저장
      await savePrdDocument(projectId, prdText);
      
      // API 키 가져오기
      const { data: apiKeyData } = await getApiKey(user.id, provider);
      
      if (!apiKeyData) {
        throw new Error('API 키를 찾을 수 없습니다. 다시 입력해주세요.');
      }
      
      // AI 분석 요청
      const { data, error } = await analyzeWithAI(
        apiKeyData.api_key,
        provider,
        prdText,
        'prd_analysis'
      );
      
      if (error) {
        // Google AI 할당량 초과 오류 처리
        if (provider === 'google' && typeof error === 'string' && error.includes('quota')) {
          setProviderError('Google AI API 할당량이 초과되었습니다. OpenAI API를 사용하거나 나중에 다시 시도해주세요.');
          throw new Error('Google AI API 할당량이 초과되었습니다. OpenAI API를 사용하거나 나중에 다시 시도해주세요.');
        }
        throw new Error(typeof error === 'string' ? error : 'AI 분석 중 오류가 발생했습니다.');
      }
      
      // JSON 파싱
      if (!data) {
        throw new Error('AI에서 반환된 데이터가 없습니다.');
      }
      
      const parsedData = JSON.parse(data);
      
      // 기능 저장
      await saveFeatures(projectId, parsedData);
      
      setAnalysisResult(parsedData);
      setActiveTab('features');
    } catch (error: any) {
      console.error('PRD 분석 오류:', error);
      alert(`PRD 분석 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateDocument = async (type: string) => {
    if (!analysisResult || !user || !projectId) return;
    
    setGeneratingDoc(type);
    
    try {
      // API 키 가져오기
      const { data: apiKeyData } = await getApiKey(user.id, provider);
      
      if (!apiKeyData) {
        throw new Error('API 키를 찾을 수 없습니다. 다시 입력해주세요.');
      }
      
      // AI 문서 생성 요청
      const analysisData = typeof analysisResult === 'string' 
        ? analysisResult 
        : JSON.stringify(analysisResult, null, 2);
      
      const { data, error } = await analyzeWithAI(
        apiKeyData.api_key,
        provider,
        analysisData,
        type
      );
      
      if (error) {
        // Google AI 할당량 초과 오류 처리
        if (provider === 'google' && typeof error === 'string' && error.includes('quota')) {
          setProviderError('Google AI API 할당량이 초과되었습니다. OpenAI API를 사용하거나 나중에 다시 시도해주세요.');
          throw new Error('Google AI API 할당량이 초과되었습니다. OpenAI API를 사용하거나 나중에 다시 시도해주세요.');
        }
        throw new Error(typeof error === 'string' ? error : 'AI 문서 생성 중 오류가 발생했습니다.');
      }
      
      // 문서 저장
      const { error: saveError } = await saveGeneratedDocument(projectId, type, data || '');
      
      if (saveError) {
        throw new Error('문서 저장 중 오류가 발생했습니다: ' + (typeof saveError === 'string' ? saveError : JSON.stringify(saveError)));
      }
      
      setGeneratedDocs({
        ...generatedDocs,
        [type]: data || ''
      });
    } catch (error: any) {
      console.error('문서 생성 오류:', error);
      alert(`문서 생성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setGeneratingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">PRD Maker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-secondary"
            >
              대시보드
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API 키 설정 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">AI API 설정</h2>
            {apiKeyStatus === 'saved' && (
              <button 
                onClick={() => setApiKeyStatus('none')} 
                className="btn btn-secondary text-sm"
              >
                API 설정 변경
              </button>
            )}
          </div>
          
          {apiKeyStatus !== 'saved' ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI 제공자 선택
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="provider"
                      value="openai"
                      checked={provider === 'openai'}
                      onChange={() => {
                        setProvider('openai');
                        setProviderError('');
                      }}
                    />
                    <span className="ml-2">OpenAI</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="provider"
                      value="google"
                      checked={provider === 'google'}
                      onChange={() => {
                        setProvider('google');
                        setProviderError('');
                      }}
                    />
                    <span className="ml-2">Google AI</span>
                  </label>
                </div>
                {providerError && (
                  <div className="mt-2 text-red-600 text-sm">
                    {providerError}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                  API 키
                </label>
                <input
                  id="api-key"
                  type="password"
                  className="form-input w-full"
                  placeholder={`${provider === 'openai' ? 'OpenAI' : 'Google AI'} API 키를 입력하세요`}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  API 키는 1일 동안만 서버에 저장되며, 이후 자동으로 삭제됩니다.
                </p>
                {apiKeyStatus === 'error' && (
                  <p className="text-red-600 text-sm mt-1">
                    API 키 저장 중 오류가 발생했습니다. 다시 시도해주세요.
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveApiKey}
                className="btn btn-primary"
                disabled={!apiKeyInput.trim()}
              >
                API 키 저장
              </button>
            </>
          ) : (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-medium">현재 AI 제공자:</span> {provider === 'openai' ? 'OpenAI' : 'Google AI'}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">API 키:</span> ******************************
              </p>
              <p className="text-xs text-gray-500 mt-3">
                API 키를 변경하려면 'API 설정 변경' 버튼을 클릭하세요.
              </p>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'prd'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('prd')}
            >
              PRD 입력
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'features'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('features')}
              disabled={!analysisResult}
            >
              기능 목록
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'tasks'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('tasks')}
              disabled={!analysisResult}
            >
              태스크 테이블
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'docs'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('docs')}
              disabled={!analysisResult}
            >
              생성된 문서
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'prd' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">PRD 작성</h2>
                <p className="text-gray-600 mb-4">
                  제품 요구사항 문서(PRD)를 작성해주세요. AI가 분석하여 기능 목록과 태스크를 추출합니다.
                </p>
                
                <div className="mb-4">
                  <textarea
                    className="form-textarea w-full h-64"
                    placeholder="PRD 내용을 입력하세요..."
                    value={prdText}
                    onChange={(e) => setPrdText(e.target.value)}
                  ></textarea>
                </div>
                
                <button
                  onClick={handleAnalyzePRD}
                  className="btn btn-primary"
                  disabled={analyzing || !prdText.trim()}
                >
                  {analyzing ? '분석 중...' : 'PRD 분석하기'}
                </button>
              </div>
            )}
            
            {activeTab === 'features' && analysisResult && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">기능 목록</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기능 이름</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisResult.map((feature: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.기능_이름 || feature.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{feature.기능_설명 || feature.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feature.우선순위 || feature.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'tasks' && analysisResult && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">태스크 테이블</h2>
                <p className="text-gray-600 mb-4">
                  기능별 태스크 목록입니다.
                </p>
                
                {analysisResult.map((feature: any, featureIndex: number) => (
                  <div key={featureIndex} className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.기능_이름 || feature.name}</h3>
                    
                    {feature.태스크 && feature.태스크.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업 내용</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예상 시간</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {feature.태스크.map((task: any, taskIndex: number) => (
                              <tr key={taskIndex}>
                                <td className="px-6 py-4 text-sm text-gray-900">{task.작업_내용 || task.task}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.담당자 || task.assignee || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.예상_소요_시간 || task.estimated_hours || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.상태 || task.status || '대기 중'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">태스크가 없습니다.</p>
                    )}
                  </div>
                ))}
                
                {generatedDocs['task_table'] && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">태스크 테이블 (마크다운)</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">{generatedDocs['task_table']}</pre>
                    </div>
                  </div>
                )}
                
                {!generatedDocs['task_table'] && (
                  <div className="mt-6">
                    <button
                      onClick={() => generateDocument('task_table')}
                      className="btn btn-primary"
                      disabled={generatingDoc === 'task_table'}
                    >
                      {generatingDoc === 'task_table' ? '생성 중...' : '마크다운 테이블 생성'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'docs' && analysisResult && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">문서 생성</h2>
                <p className="text-gray-600 mb-4">
                  PRD 분석 결과를 바탕으로 다양한 문서를 생성할 수 있습니다.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border rounded-md p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">함수 맵</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      각 기능에 필요한 함수들의 맵을 생성합니다.
                    </p>
                    <button
                      onClick={() => generateDocument('function_map')}
                      className="btn btn-primary w-full"
                      disabled={generatingDoc === 'function_map'}
                    >
                      {generatingDoc === 'function_map' ? '생성 중...' : '함수 맵 생성'}
                    </button>
                  </div>
                  
                  <div className="bg-white border rounded-md p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">개발 트리</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      개발 기술 스택과 파일 구조를 포함한 개발 트리를 생성합니다.
                    </p>
                    <button
                      onClick={() => generateDocument('dev_tree')}
                      className="btn btn-primary w-full"
                      disabled={generatingDoc === 'dev_tree'}
                    >
                      {generatingDoc === 'dev_tree' ? '생성 중...' : '개발 트리 생성'}
                    </button>
                  </div>
                  
                  <div className="bg-white border rounded-md p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">시스템 구성</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      전체 시스템 구성도를 생성합니다.
                    </p>
                    <button
                      onClick={() => generateDocument('system_config')}
                      className="btn btn-primary w-full"
                      disabled={generatingDoc === 'system_config'}
                    >
                      {generatingDoc === 'system_config' ? '생성 중...' : '시스템 구성 생성'}
                    </button>
                  </div>
                </div>
                
                {/* 생성된 문서 표시 */}
                {Object.keys(generatedDocs).filter(key => key !== 'task_table').length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">생성된 문서</h3>
                    
                    {generatedDocs['function_map'] && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-2">함수 맵</h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="whitespace-pre-wrap text-sm">{generatedDocs['function_map']}</pre>
                        </div>
                      </div>
                    )}
                    
                    {generatedDocs['dev_tree'] && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-2">개발 트리</h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="whitespace-pre-wrap text-sm">{generatedDocs['dev_tree']}</pre>
                        </div>
                      </div>
                    )}
                    
                    {generatedDocs['system_config'] && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-2">시스템 구성</h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="whitespace-pre-wrap text-sm">{generatedDocs['system_config']}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
