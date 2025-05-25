import Link from 'next/link';
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">PRD Maker</h1>
          <div className="flex space-x-4">
            <Link href="/auth/login" className="btn btn-secondary">
              로그인
            </Link>
            <Link href="/auth/register" className="btn btn-primary">
              회원가입
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main>
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  AI로 PRD를 더 쉽게 <br />
                  <span className="text-primary-600">관리하세요</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  PRD Maker는 AI를 활용하여 제품 요구사항 문서를 분석하고, 기능을 추출하여 개발 태스크로 변환해주는 서비스입니다.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/auth/register" className="btn btn-primary text-center py-3 px-6">
                    지금 시작하기
                  </Link>
                  <Link href="#features" className="btn btn-secondary text-center py-3 px-6">
                    기능 살펴보기
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative h-80 w-full">
                  <div className="absolute inset-0 bg-primary-100 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-5xl text-primary-600 mb-4">📝</div>
                      <p className="text-xl font-semibold text-primary-800">PRD 문서 분석</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 bg-primary-200 rounded-lg p-6">
                      <div className="text-4xl mb-2">🚀</div>
                      <p className="text-lg font-medium text-primary-800">기능 추출</p>
                    </div>
                    <div className="absolute -left-4 -top-4 bg-primary-200 rounded-lg p-6">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-lg font-medium text-primary-800">태스크 생성</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 섹션 */}
        <section id="features" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">주요 기능</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                PRD Maker는 제품 개발 프로세스를 간소화하고 효율적으로 만들어주는 다양한 기능을 제공합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card">
                <div className="text-4xl mb-4 text-primary-600">🤖</div>
                <h3 className="text-xl font-semibold mb-2">AI 분석</h3>
                <p className="text-gray-600">
                  OpenAI 또는 Google AI API를 활용하여 PRD 문서를 분석하고 핵심 기능을 추출합니다.
                </p>
              </div>

              <div className="card">
                <div className="text-4xl mb-4 text-primary-600">📋</div>
                <h3 className="text-xl font-semibold mb-2">태스크 테이블 생성</h3>
                <p className="text-gray-600">
                  추출된 기능을 바탕으로 개발 태스크 테이블을 자동으로 생성합니다.
                </p>
              </div>

              <div className="card">
                <div className="text-4xl mb-4 text-primary-600">📄</div>
                <h3 className="text-xl font-semibold mb-2">문서 자동 생성</h3>
                <p className="text-gray-600">
                  기능 명세서, 함수 맵, 개발 트리 등 다양한 문서를 자동으로 생성합니다.
                </p>
              </div>

              <div className="card">
                <div className="text-4xl mb-4 text-primary-600">🔄</div>
                <h3 className="text-xl font-semibold mb-2">외부 서비스 연동</h3>
                <p className="text-gray-600">
                  Jira, Notion 등 외부 서비스와 연동하여 태스크를 관리할 수 있습니다.
                </p>
              </div>

              <div className="card">
                <div className="text-4xl mb-4 text-primary-600">👥</div>
                <h3 className="text-xl font-semibold mb-2">팀 협업</h3>
                <p className="text-gray-600">
                  생성된 문서와 태스크를 팀원들과 공유하고 협업할 수 있습니다.
                </p>
              </div>

              <div className="card">
                <div className="text-4xl mb-4 text-primary-600">🔒</div>
                <h3 className="text-xl font-semibold mb-2">보안</h3>
                <p className="text-gray-600">
                  API 키는 1일만 서버에 보관되며, 이후 자동으로 삭제됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 사용 방법 섹션 */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">사용 방법</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                PRD Maker를 사용하여 제품 요구사항을 효율적으로 관리하는 방법입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="card">
                <div className="text-2xl font-bold text-primary-600 mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">회원가입</h3>
                <p className="text-gray-600">
                  이메일로 간단하게 회원가입하고 서비스를 시작하세요.
                </p>
              </div>

              <div className="card">
                <div className="text-2xl font-bold text-primary-600 mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">AI API 키 입력</h3>
                <p className="text-gray-600">
                  OpenAI 또는 Google AI API 키를 입력하여 AI 기능을 활성화하세요.
                </p>
              </div>

              <div className="card">
                <div className="text-2xl font-bold text-primary-600 mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">PRD 입력</h3>
                <p className="text-gray-600">
                  PRD 문서를 입력하거나 업로드하여 분석을 시작하세요.
                </p>
              </div>

              <div className="card">
                <div className="text-2xl font-bold text-primary-600 mb-4">4</div>
                <h3 className="text-xl font-semibold mb-2">결과 활용</h3>
                <p className="text-gray-600">
                  생성된 기능, 태스크, 문서를 활용하여 개발을 시작하세요.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/auth/register" className="btn btn-primary py-3 px-6">
                지금 시작하기
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">PRD Maker</h2>
              <p className="text-gray-400">AI로 더 쉽게 PRD 관리하기</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                이용약관
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                개인정보처리방침
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                문의하기
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} PRD Maker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
