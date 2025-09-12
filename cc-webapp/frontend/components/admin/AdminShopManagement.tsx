'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Package,
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ShopProduct {
  id: number;
  product_id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  metadata: Record<string, any>;
  extra: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface ShopStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  deleted_products: number;
  total_sales: number;
  total_revenue: number;
  categories: string[];
}

const AdminShopManagement: React.FC = () => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const ITEMS_PER_PAGE = 10;

  // API 호출 함수
  const fetchProducts = async (skip: number = 0, limit: number = ITEMS_PER_PAGE) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (activeFilter !== null) params.append('is_active', activeFilter.toString());

      const response = await fetch(`/api/admin/shop/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalProducts(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/shop/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('통계 조회 실패:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const toggleProductActive = async (productId: number, isActive: boolean) => {
    try {
      const endpoint = isActive ? 'activate' : 'deactivate';
      const response = await fetch(`/api/admin/shop/products/${productId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('상품 상태 변경 실패');
      }

      await fetchProducts((currentPage - 1) * ITEMS_PER_PAGE);
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : '상품 상태 변경에 실패했습니다.');
    }
  };

  // Effects
  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [currentPage, searchTerm, activeFilter]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">상점 관리</h1>
          <p className="text-gray-600">상품 등록, 수정, 삭제 및 통계를 관리합니다</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 상품 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 상품</p>
                  <p className="text-2xl font-bold">{stats.total_products}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 상품</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_products}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">비활성 상품</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive_products}</p>
                </div>
                <EyeOff className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 매출</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(stats.total_revenue)}원</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="상품명, 상품ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                onClick={() => setActiveFilter(null)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                전체
              </Button>
              <Button
                variant={activeFilter === true ? "default" : "outline"}
                onClick={() => setActiveFilter(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                활성
              </Button>
              <Button
                variant={activeFilter === false ? "default" : "outline"}
                onClick={() => setActiveFilter(false)}
                className="flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                비활성
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  fetchProducts((currentPage - 1) * ITEMS_PER_PAGE);
                  fetchStats();
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* 상품 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>상품 목록 ({totalProducts}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">로딩 중...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">상품 정보</th>
                      <th className="text-left p-4">가격</th>
                      <th className="text-left p-4">상태</th>
                      <th className="text-left p-4">생성일</th>
                      <th className="text-right p-4">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">ID: {product.product_id}</p>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono">{formatPrice(product.price)}원</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? '활성' : '비활성'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductActive(product.id, !product.is_active)}
                            >
                              {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {new Date(product.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShopManagement;

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">상점 관리</h1>
          <p className="text-gray-600">상품 등록, 수정, 삭제 및 통계를 관리합니다</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 상품 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 상품</p>
                  <p className="text-2xl font-bold">{stats.total_products}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 상품</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_products}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">비활성 상품</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive_products}</p>
                </div>
                <EyeOff className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 매출</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(stats.total_revenue)}원</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="상품명, 상품ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                onClick={() => setActiveFilter(null)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                전체
              </Button>
              <Button
                variant={activeFilter === true ? "default" : "outline"}
                onClick={() => setActiveFilter(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                활성
              </Button>
              <Button
                variant={activeFilter === false ? "default" : "outline"}
                onClick={() => setActiveFilter(false)}
                className="flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                비활성
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  fetchProducts((currentPage - 1) * ITEMS_PER_PAGE);
                  fetchStats();
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Alert className=\"border-red-200 bg-red-50\">
          <AlertDescription className=\"text-red-800\">{error}</AlertDescription>
        </Alert>
      )}

      {/* 상품 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>상품 목록 ({totalProducts}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className=\"flex justify-center items-center py-8\">
              <RefreshCw className=\"w-6 h-6 animate-spin\" />
              <span className=\"ml-2\">로딩 중...</span>
            </div>
          ) : (
            <>
              <div className=\"overflow-x-auto\">
                <table className=\"w-full\">
                  <thead>
                    <tr className=\"border-b\">
                      <th className=\"text-left p-4\">상품 정보</th>
                      <th className=\"text-left p-4\">가격</th>
                      <th className=\"text-left p-4\">상태</th>
                      <th className=\"text-left p-4\">생성일</th>
                      <th className=\"text-right p-4\">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className=\"border-b hover:bg-gray-50\">
                        <td className=\"p-4\">
                          <div>
                            <p className=\"font-medium\">{product.name}</p>
                            <p className=\"text-sm text-gray-500\">ID: {product.product_id}</p>
                            {product.description && (
                              <p className=\"text-sm text-gray-600 mt-1\">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className=\"p-4\">
                          <span className=\"font-mono\">{formatPrice(product.price)}원</span>
                        </td>
                        <td className=\"p-4\">
                          <div className=\"flex items-center gap-2\">
                            <Badge variant={product.is_active ? \"default\" : \"secondary\"}>
                              {product.is_active ? '활성' : '비활성'}
                            </Badge>
                            <Button
                              variant=\"ghost\"
                              size=\"sm\"
                              onClick={() => toggleProductActive(product.id, !product.is_active)}
                            >
                              {product.is_active ? <EyeOff className=\"w-4 h-4\" /> : <Eye className=\"w-4 h-4\" />}
                            </Button>
                          </div>
                        </td>
                        <td className=\"p-4\">
                          <span className=\"text-sm text-gray-600\">
                            {new Date(product.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </td>
                        <td className=\"p-4\">
                          <div className=\"flex justify-end gap-2\">
                            <Button
                              variant=\"outline\"
                              size=\"sm\"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit2 className=\"w-4 h-4\" />
                            </Button>
                            <Button
                              variant=\"outline\"
                              size=\"sm\"
                              onClick={() => deleteProduct(product.id)}
                              className=\"text-red-600 hover:text-red-700\"
                            >
                              <Trash2 className=\"w-4 h-4\" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className=\"flex justify-center items-center mt-6 gap-2\">
                  <Button
                    variant=\"outline\"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  
                  <span className=\"px-4 py-2 text-sm text-gray-600\">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    variant=\"outline\"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 상품 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className=\"max-w-2xl\">
          <DialogHeader>
            <DialogTitle>새 상품 추가</DialogTitle>
          </DialogHeader>
          <div className=\"space-y-4\">
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label htmlFor=\"product_id\">상품 ID</Label>
                <Input
                  id=\"product_id\"
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  placeholder=\"예: premium_pack_001\"
                />
              </div>
              <div>
                <Label htmlFor=\"name\">상품명</Label>
                <Input
                  id=\"name\"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=\"예: 프리미엄 패키지\"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor=\"description\">상품 설명</Label>
              <Textarea
                id=\"description\"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder=\"상품에 대한 자세한 설명을 입력하세요\"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor=\"price\">가격</Label>
              <Input
                id=\"price\"
                type=\"number\"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                placeholder=\"0\"
              />
            </div>
            
            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"is_active\"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor=\"is_active\">활성 상태</Label>
            </div>
            
            <div className=\"flex justify-end gap-2 pt-4\">
              <Button variant=\"outline\" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={createProduct}>
                상품 생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 상품 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className=\"max-w-2xl\">
          <DialogHeader>
            <DialogTitle>상품 수정</DialogTitle>
          </DialogHeader>
          <div className=\"space-y-4\">
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label htmlFor=\"edit_product_id\">상품 ID</Label>
                <Input
                  id=\"edit_product_id\"
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  placeholder=\"예: premium_pack_001\"
                />
              </div>
              <div>
                <Label htmlFor=\"edit_name\">상품명</Label>
                <Input
                  id=\"edit_name\"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=\"예: 프리미엄 패키지\"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor=\"edit_description\">상품 설명</Label>
              <Textarea
                id=\"edit_description\"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder=\"상품에 대한 자세한 설명을 입력하세요\"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor=\"edit_price\">가격</Label>
              <Input
                id=\"edit_price\"
                type=\"number\"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                placeholder=\"0\"
              />
            </div>
            
            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"edit_is_active\"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor=\"edit_is_active\">활성 상태</Label>
            </div>
            
            <div className=\"flex justify-end gap-2 pt-4\">
              <Button variant=\"outline\" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={updateProduct}>
                상품 수정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShopManagement;
