import React from 'react';
import { BookOpen, TrendingUp, Clock, Users } from 'lucide-react';
import type { User, ScoreRecord } from '../types';

interface AnalyticsPageProps {
  user: User | null;
  scoreRecords: ScoreRecord[];
}

interface ImprovementStats {
  [subject: string]: {
    totalImprovement: number;
    totalImprovementPercent: number;
    recordCount: number;
    records: ScoreRecord[];
  };
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ user, scoreRecords }) => {
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先登录查看学习分析</p>
      </div>
    );
  }

  // 获取学生进步统计
  const getStudentImprovementStats = (studentId: string): ImprovementStats | null => {
    const records = scoreRecords.filter(r => r.studentId === studentId);
    if (records.length === 0) return null;

    const improvementBySubject = records.reduce((acc, record) => {
      const improvement = record.afterScore - record.beforeScore;
      const improvementPercent = (improvement / record.maxScore) * 100;
      
      if (!acc[record.subject]) {
        acc[record.subject] = {
          totalImprovement: 0,
          totalImprovementPercent: 0,
          recordCount: 0,
          records: []
        };
      }
      
      acc[record.subject].totalImprovement += improvement;
      acc[record.subject].totalImprovementPercent += improvementPercent;
      acc[record.subject].recordCount += 1;
      acc[record.subject].records.push(record);
      
      return acc;
    }, {} as ImprovementStats);

    return improvementBySubject;
  };

  const studentStats = user.role === 'student' ? getStudentImprovementStats(user.id) : null;
  const teacherRecords = user.role === 'teacher' ? scoreRecords.filter(r => r.teacherId === user.id) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">学习分析</h1>

      {user.role === 'student' && studentStats && (
        <>
          {/* 总体进步概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">总提分</p>
                  <p className="text-2xl font-bold">
                    {Object.values(studentStats).reduce((sum, subject) => sum + subject.totalImprovement, 0)}分
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">补习科目</p>
                  <p className="text-2xl font-bold">{Object.keys(studentStats).length}门</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">总课时</p>
                  <p className="text-2xl font-bold">
                    {Object.values(studentStats).reduce((sum, subject) => 
                      sum + subject.records.reduce((s, r) => s + r.lessonCount, 0), 0
                    )}小时
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* 各科目进步详情 */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-bold">各科目学习进度</h2>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                {Object.entries(studentStats).map(([subject, data]) => {
                  const avgImprovement = data.totalImprovement / data.recordCount;
                  const lastRecord = data.records[data.records.length - 1];
                  
                  return (
                    <div key={subject} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{subject}</h3>
                          <p className="text-sm text-gray-600">共{data.recordCount}次测试</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">+{avgImprovement.toFixed(1)}分</div>
                          <div className="text-sm text-gray-500">平均提升</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">{data.records[0]?.beforeScore || 0}</div>
                          <div className="text-xs text-gray-500">起始分数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{lastRecord?.afterScore || 0}</div>
                          <div className="text-xs text-gray-500">最新分数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">{data.totalImprovement}</div>
                          <div className="text-xs text-gray-500">总提升</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600">
                            {data.records.reduce((sum, r) => sum + r.lessonCount, 0)}
                          </div>
                          <div className="text-xs text-gray-500">总课时</div>
                        </div>
                      </div>
                      
                      {/* 分数进步线 */}
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">学习进度:</div>
                        <div className="flex items-center space-x-2">
                          {data.records.map((record, index) => (
                            <React.Fragment key={record.id}>
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${
                                  record.afterScore > record.beforeScore ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                <div className="text-xs mt-1">{record.afterScore}</div>
                              </div>
                              {index < data.records.length - 1 && (
                                <div className="flex-1 h-px bg-gray-300" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {user.role === 'teacher' && (
        <>
          {/* 教学统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">教过的学生</p>
                    <p className="text-2xl font-bold">{new Set(teacherRecords.map(r => r.studentId)).size}人</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">平均提分</p>
                    <p className="text-2xl font-bold text-green-600">
                      {teacherRecords.length > 0 
                        ? (teacherRecords.reduce((sum, r) => sum + (r.afterScore - r.beforeScore), 0) / teacherRecords.length).toFixed(1)
                        : 0
                      }分
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">总课时</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {teacherRecords.reduce((sum, r) => sum + r.lessonCount, 0)}小时
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">成绩记录</p>
                    <p className="text-2xl font-bold text-orange-600">{teacherRecords.length}条</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* 教学效果详情 */}
          {teacherRecords.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-bold">教学效果分析</h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {Object.entries(
                    teacherRecords.reduce((acc, record) => {
                      if (!acc[record.subject]) {
                        acc[record.subject] = [];
                      }
                      acc[record.subject].push(record);
                      return acc;
                    }, {} as { [key: string]: ScoreRecord[] })
                  ).map(([subject, records]) => {
                    const avgImprovement = records.reduce((sum, r) => sum + (r.afterScore - r.beforeScore), 0) / records.length;
                    const totalHours = records.reduce((sum, r) => sum + r.lessonCount, 0);
                    
                    return (
                      <div key={subject} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-lg">{subject}</h3>
                            <p className="text-sm text-gray-600">{records.length}位学生 • {totalHours}课时</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">+{avgImprovement.toFixed(1)}分</div>
                            <div className="text-sm text-gray-500">平均提分</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 无数据状态 */}
      {user.role === 'student' && !studentStats && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学习数据</h3>
          <p className="text-gray-500">开始学习后就能看到你的进步统计了</p>
        </div>
      )}

      {user.role === 'teacher' && teacherRecords.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无教学数据</h3>
          <p className="text-gray-500">开始教学后就能看到你的教学统计了</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;