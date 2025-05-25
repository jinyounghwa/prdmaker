'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getUser, getProjects } from '@/lib/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
      
      // 사용자의 프로젝트 목록 가져오기
      const { data, error } = await getProjects(currentUser.id);
      if (data) {
        setProjects(data);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          { 
            name: newProjectName, 
            description: newProjectDescription,
            user_id: user.id 
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setProjects([...projects, data[0] as Project]);
        setNewProjectName('');
        setNewProjectDescription('');
        setShowNewProjectForm(false);
      }
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
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
              onClick={handleSignOut}
              className="btn btn-secondary"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">내 프로젝트</h2>
          <button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            className="btn btn-primary"
          >
            {showNewProjectForm ? '취소' : '새 프로젝트 생성'}
          </button>
        </div>

        {/* 새 프로젝트 생성 폼 */}
        {showNewProjectForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">새 프로젝트 생성</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 이름
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  className="form-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 설명 (선택사항)
                </label>
                <textarea
                  id="project-description"
                  className="form-input"
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 프로젝트 목록 */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/prompt?projectId=${project.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    생성일: {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-primary-600">자세히 보기 &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              새 프로젝트를 생성하여 PRD 분석을 시작해보세요.
            </p>
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="btn btn-primary"
            >
              첫 프로젝트 생성하기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
