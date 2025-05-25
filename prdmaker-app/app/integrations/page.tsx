'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getUser, getIntegration } from '@/lib/supabase';

export default function IntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jira' | 'notion'>('jira');
  
  // Jira 연동 상태
  const [jiraApiKey, setJiraApiKey] = useState('');
  const [jiraDomain, setJiraDomain] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [jiraIntegrated, setJiraIntegrated] = useState(false);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [isEditingJira, setIsEditingJira] = useState(false);
  
  // Notion 연동 상태
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [notionIntegrated, setNotionIntegrated] = useState(false);
  const [notionLoading, setNotionLoading] = useState(false);
  const [isEditingNotion, setIsEditingNotion] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      
      setUser(currentUser);
      
      // 기존 연동 정보 확인
      const { data: jiraData } = await getIntegration(currentUser.id, 'jira');
      if (jiraData) {
        setJiraDomain(jiraData.service_url || '');
        setJiraProjectKey(jiraData.project_key || '');
        setJiraIntegrated(true);
      }
      
      const { data: notionData } = await getIntegration(currentUser.id, 'notion');
      if (notionData) {
        setNotionDatabaseId(notionData.service_url || '');
        setNotionIntegrated(true);
      }
      
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleJiraIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jiraApiKey || !jiraDomain || !jiraProjectKey) return;
    
    setJiraLoading(true);
    
    try {
      const response = await fetch('/api/integrations/jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          apiKey: jiraApiKey,
          domain: jiraDomain,
          projectKey: jiraProjectKey,
          features: [] // 테스트용 빈 배열
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Jira 연동 중 오류가 발생했습니다.');
      }
      
      setJiraIntegrated(true);
      setJiraApiKey('');
      setIsEditingJira(false); // Exit edit mode on success
      alert(isEditingJira ? 'Jira 연동 정보가 업데이트되었습니다.' : 'Jira 연동이 완료되었습니다.');
    } catch (error: any) {
      console.error('Jira 연동 오류:', error);
      alert(`Jira 연동 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setJiraLoading(false);
    }
  };

  const handleNotionIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notionApiKey || !notionDatabaseId) return;
    
    setNotionLoading(true);
    
    try {
      const response = await fetch('/api/integrations/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          apiKey: notionApiKey,
          databaseId: notionDatabaseId,
          features: [] // 테스트용 빈 배열
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Notion 연동 중 오류가 발생했습니다.');
      }
      
      setNotionIntegrated(true);
      setNotionApiKey('');
      setIsEditingNotion(false); // Exit edit mode on success
      alert(isEditingNotion ? 'Notion 연동 정보가 업데이트되었습니다.' : 'Notion 연동이 완료되었습니다.');
    } catch (error: any) {
      console.error('Notion 연동 오류:', error);
      alert(`Notion 연동 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setNotionLoading(false);
    }
  };

  const handleJiraDisconnect = async () => {
    if (!user || !window.confirm('Jira 연동을 해제하시겠습니까?')) return;

    setJiraLoading(true);
    try {
      const response = await fetch('/api/integrations/jira', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Jira 연동 해제 중 오류가 발생했습니다.');
      }

      setJiraIntegrated(false);
      setIsEditingJira(false);
      setJiraApiKey('');
      setJiraDomain('');
      setJiraProjectKey('');
      alert('Jira 연동이 해제되었습니다.');
    } catch (error: any) {
      console.error('Jira 연동 해제 오류:', error);
      alert(`Jira 연동 해제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setJiraLoading(false);
    }
  };

  const handleNotionDisconnect = async () => {
    if (!user || !window.confirm('Notion 연동을 해제하시겠습니까?')) return;

    setNotionLoading(true);
    try {
      const response = await fetch('/api/integrations/notion', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Notion 연동 해제 중 오류가 발생했습니다.');
      }

      setNotionIntegrated(false);
      setIsEditingNotion(false);
      setNotionApiKey('');
      setNotionDatabaseId('');
      alert('Notion 연동이 해제되었습니다.');
    } catch (error: any) {
      console.error('Notion 연동 해제 오류:', error);
      alert(`Notion 연동 해제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setNotionLoading(false);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-8">외부 서비스 연동</h2>
        
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'jira'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('jira')}
            >
              Jira 연동
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'notion'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('notion')}
            >
              Notion 연동
            </button>
          </div>

          <div className="p-6">
            {/* Jira 연동 탭 */}
            {activeTab === 'jira' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Jira 연동 설정</h3>
                
                {jiraIntegrated && !isEditingJira ? (
                  <div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Jira 연동이 완료되었습니다.
                          </p>
                          <p className="mt-2 text-sm text-green-700">
                            도메인: {jiraDomain}<br />
                            프로젝트 키: {jiraProjectKey}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setIsEditingJira(true);
                          setJiraApiKey(''); // Clear API key for editing
                        }}
                        className="btn btn-secondary"
                        disabled={jiraLoading}
                      >
                        설정 변경
                      </button>
                      <button
                        onClick={handleJiraDisconnect}
                        className="btn btn-danger"
                        disabled={jiraLoading}
                      >
                        {jiraLoading ? '해제 중...' : 'Jira 연동 해제'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleJiraIntegration} className="space-y-4">
                    <div>
                      <label htmlFor="jira-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                        Jira API 키
                      </label>
                      <input
                        id="jira-api-key"
                        type="password"
                        className="form-input"
                        placeholder={isEditingJira ? "새로운 API 키를 입력하거나 기존 키를 다시 입력하세요" : "Jira API 키를 입력하세요"}
                        value={jiraApiKey}
                        onChange={(e) => setJiraApiKey(e.target.value)}
                        required
                      />
                      {isEditingJira && (
                        <p className="mt-1 text-xs text-gray-500">보안을 위해 변경사항 저장 시 API 키를 다시 입력해야 합니다.</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="jira-domain" className="block text-sm font-medium text-gray-700 mb-1">
                        Jira 도메인
                      </label>
                      <input
                        id="jira-domain"
                        type="text"
                        className="form-input"
                        placeholder="예: your-domain.atlassian.net"
                        value={jiraDomain}
                        onChange={(e) => setJiraDomain(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="jira-project-key" className="block text-sm font-medium text-gray-700 mb-1">
                        Jira 프로젝트 키
                      </label>
                      <input
                        id="jira-project-key"
                        type="text"
                        className="form-input"
                        placeholder="예: PRD"
                        value={jiraProjectKey}
                        onChange={(e) => setJiraProjectKey(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={jiraLoading}
                      >
                        {jiraLoading ? (isEditingJira ? '저장 중...' : '연동 중...') : (isEditingJira ? '변경사항 저장' : 'Jira 연동하기')}
                      </button>
                      {isEditingJira && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingJira(false);
                            // Restore original values if needed, or re-fetch
                            const fetchJiraData = async () => { // Re-fetch to get original values
                              if(user) {
                                const { data } = await getIntegration(user.id, 'jira');
                                if (data) {
                                  setJiraDomain(data.service_url || '');
                                  setJiraProjectKey(data.project_key || '');
                                } else { // Should not happen if we are in edit mode
                                  setJiraIntegrated(false);
                                }
                              }
                            };
                            fetchJiraData();
                          }}
                          className="btn btn-secondary"
                          disabled={jiraLoading}
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </form>
                )}
                
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Jira 연동 방법</h4>
                  <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                    <li>Jira 계정에 로그인합니다.</li>
                    <li>프로필 &gt; 계정 설정 &gt; 보안 탭으로 이동합니다.</li>
                    <li>API 토큰 생성을 클릭하여 새 토큰을 생성합니다.</li>
                    <li>생성된 토큰을 위 API 키 필드에 입력합니다.</li>
                    <li>Jira 도메인은 your-domain.atlassian.net 형식으로 입력합니다.</li>
                    <li>프로젝트 키는 Jira 프로젝트의 키를 입력합니다.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Notion 연동 탭 */}
            {activeTab === 'notion' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notion 연동 설정</h3>
                
                {notionIntegrated && !isEditingNotion ? (
                  <div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Notion 연동이 완료되었습니다.
                          </p>
                          <p className="mt-2 text-sm text-green-700">
                            데이터베이스 ID: {notionDatabaseId}
                          </p>
                        </div>
                      </div>
                    </div>
                     <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setIsEditingNotion(true);
                          setNotionApiKey(''); // Clear API key for editing
                        }}
                        className="btn btn-secondary"
                        disabled={notionLoading}
                      >
                        설정 변경
                      </button>
                      <button
                        onClick={handleNotionDisconnect}
                        className="btn btn-danger"
                        disabled={notionLoading}
                      >
                        {notionLoading ? '해제 중...' : 'Notion 연동 해제'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleNotionIntegration} className="space-y-4">
                    <div>
                      <label htmlFor="notion-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                        Notion API 키
                      </label>
                      <input
                        id="notion-api-key"
                        type="password"
                        className="form-input"
                        placeholder={isEditingNotion ? "새로운 API 키를 입력하거나 기존 키를 다시 입력하세요" : "Notion API 키를 입력하세요"}
                        value={notionApiKey}
                        onChange={(e) => setNotionApiKey(e.target.value)}
                        required
                      />
                      {isEditingNotion && (
                         <p className="mt-1 text-xs text-gray-500">보안을 위해 변경사항 저장 시 API 키를 다시 입력해야 합니다.</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="notion-database-id" className="block text-sm font-medium text-gray-700 mb-1">
                        Notion 데이터베이스 ID
                      </label>
                      <input
                        id="notion-database-id"
                        type="text"
                        className="form-input"
                        placeholder="예: 1234abcd5678efgh9012ijkl"
                        value={notionDatabaseId}
                        onChange={(e) => setNotionDatabaseId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={notionLoading}
                      >
                        {notionLoading ? (isEditingNotion ? '저장 중...' : '연동 중...') : (isEditingNotion ? '변경사항 저장' : 'Notion 연동하기')}
                      </button>
                      {isEditingNotion && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingNotion(false);
                            // Restore original values
                             const fetchNotionData = async () => { // Re-fetch to get original values
                              if(user) {
                                const { data } = await getIntegration(user.id, 'notion');
                                if (data) {
                                  setNotionDatabaseId(data.service_url || '');
                                } else { // Should not happen
                                  setNotionIntegrated(false);
                                }
                              }
                            };
                            fetchNotionData();
                          }}
                          className="btn btn-secondary"
                          disabled={notionLoading}
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </form>
                )}
                
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Notion 연동 방법</h4>
                  <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                    <li>Notion 개발자 페이지(developers.notion.com)에서 새 통합을 생성합니다.</li>
                    <li>통합을 생성한 후 API 키(Secret)를 복사합니다.</li>
                    <li>Notion에서 데이터베이스를 생성하고 통합을 연결합니다.</li>
                    <li>데이터베이스 URL에서 ID를 복사합니다. (URL 형식: notion.so/workspace/[DATABASE_ID]?...)</li>
                    <li>복사한 API 키와 데이터베이스 ID를 위 필드에 입력합니다.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
