'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Trash2,
  Save
} from 'lucide-react';
import { UserImportData } from '../../types/admin';
import { validateFileUpload, validateNickname, validateEmail } from '../../utils/securityUtils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';

interface UserBulkManagerProps {
  onAddNotification: (message: string) => void;
  onUsersImported: (users: UserImportData[]) => void;
}

interface ImportResult {
  success: UserImportData[];
  errors: Array<{ row: number; error: string; data: any }>;
}

export function UserBulkManager({ onAddNotification, onUsersImported }: UserBulkManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Process uploaded file
  const handleFileUpload = async (file: File) => {
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      onAddNotification(`❌ ${validation.error}`);
      return;
    }

    setIsProcessing(true);

    try {
      const text = await file.text();
      let data: any[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        // Excel 파일의 경우 실제로는 라이브러리가 필요하지만, 
        // 여기서는 CSV 형식으로 시뮬레이션
        onAddNotification('Excel 파일 지원을 위해 CSV 형식을 사용해주세요.');
        setIsProcessing(false);
        return;
      }

      const result = await processImportData(data);
      setImportResult(result);
      setShowPreview(true);
      
      onAddNotification(`📊 ${result.success.length}개 유효, ${result.errors.length}개 오류`);
    } catch (error) {
      onAddNotification('❌ 파일 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse CSV data
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      row._rowNumber = i + 1;
      data.push(row);
    }

    return data;
  };

  // Process and validate import data
  const processImportData = async (data: any[]): Promise<ImportResult> => {
    const success: UserImportData[] = [];
    const errors: Array<{ row: number; error: string; data: any }> = [];

    for (const row of data) {
      try {
        const userData: UserImportData = {
          nickname: row.nickname || row['닉네임'] || '',
          email: row.email || row['이메일'],
          goldBalance: parseInt(row.goldbalance || row['골드'] || '10000'),
          level: parseInt(row.level || row['레벨'] || '1'),
          isAdmin: (row.isadmin || row['관리자'] || '').toLowerCase() === 'true'
        };

        // Validate nickname
        const nicknameValidation = validateNickname(userData.nickname);
        if (!nicknameValidation.isValid) {
          errors.push({
            row: row._rowNumber,
            error: `닉네임: ${nicknameValidation.error}`,
            data: row
          });
          continue;
        }

        // Validate email if provided
        if (userData.email) {
          const emailValidation = validateEmail(userData.email);
          if (!emailValidation.isValid) {
            errors.push({
              row: row._rowNumber,
              error: `이메일: ${emailValidation.error}`,
              data: row
            });
            continue;
          }
        }

        // Validate numeric fields
        if (isNaN(userData.goldBalance) || userData.goldBalance < 0) {
          errors.push({
            row: row._rowNumber,
            error: '골드: 유효한 숫자여야 합니다 (0 이상)',
            data: row
          });
          continue;
        }

        if (isNaN(userData.level) || userData.level < 1) {
          errors.push({
            row: row._rowNumber,
            error: '레벨: 유효한 숫자여야 합니다 (1 이상)',
            data: row
          });
          continue;
        }

        success.push(userData);
      } catch (error) {
        errors.push({
          row: row._rowNumber,
          error: '알 수 없는 오류가 발생했습니다',
          data: row
        });
      }
    }

    return { success, errors };
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (importResult?.success) {
      onUsersImported(importResult.success);
      setImportResult(null);
      setShowPreview(false);
      onAddNotification(`✅ ${importResult.success.length}명의 사용자가 추가되었습니다.`);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = `nickname,email,goldBalance,level,isAdmin
testuser1,user1@example.com,15000,1,false
testuser2,user2@example.com,25000,5,false
admin1,admin@example.com,999999,99,true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onAddNotification('📥 템플릿 파일이 다운로드되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">사용자 일괄 관리</h2>
          <p className="text-muted-foreground">CSV/Excel 파일을 통한 사용자 일괄 업로드</p>
        </div>
        
        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="btn-hover-lift"
        >
          <Download className="w-4 h-4 mr-2" />
          템플릿 다운로드
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging 
                ? 'border-primary bg-primary-soft' 
                : 'border-border-secondary hover:border-primary'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
          >
            <motion.div
              animate={{ scale: isDragging ? 1.05 : 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  파일을 드래그하거나 클릭하여 업로드
                </h3>
                <p className="text-muted-foreground">
                  CSV 또는 Excel 파일 (최대 10MB)
                </p>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-gradient-game btn-hover-lift"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? '처리 중...' : '파일 선택'}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          </div>

          {isProcessing && (
            <div className="mt-6">
              <Progress value={undefined} className="h-2" />
              <p className="text-center text-muted-foreground mt-2">
                파일을 처리하고 있습니다...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-info" />
            가져오기 가이드라인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">필수 컬럼</h4>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li>• <code>nickname</code> - 사용자 닉네임 (2-20자, 영문/숫자/한글/_/- 허용)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">선택 컬럼</h4>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li>• <code>email</code> - 이메일 주소</li>
              <li>• <code>goldBalance</code> - 골드 잔액 (기본: 10000)</li>
              <li>• <code>level</code> - 레벨 (기본: 1)</li>
              <li>• <code>isAdmin</code> - 관리자 여부 (true/false)</li>
            </ul>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              중복된 닉네임이나 잘못된 형식의 데이터는 자동으로 제외됩니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && importResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">가져오기 미리보기</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-success flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      성공 ({importResult.success.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResult.success.slice(0, 10).map((user, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{user.nickname}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {user.level}Lv
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {user.goldBalance?.toLocaleString()}G
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {importResult.success.length > 10 && (
                        <div className="text-muted-foreground text-xs text-center">
                          ...및 {importResult.success.length - 10}개 더
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-error flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      오류 ({importResult.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium text-error">행 {error.row}</div>
                          <div className="text-muted-foreground text-xs">{error.error}</div>
                        </div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <div className="text-muted-foreground text-xs text-center">
                          ...및 {importResult.errors.length - 5}개 더
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={importResult.success.length === 0}
                  className="flex-1 bg-gradient-game btn-hover-lift"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {importResult.success.length}명 가져오기
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}