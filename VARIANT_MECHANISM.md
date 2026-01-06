# Cơ chế thêm Variant sản phẩm

## Tổng quan

Hệ thống hỗ trợ 2 chế độ tạo variant:

1. **Edit Mode** (Sản phẩm đã tồn tại): Tạo variant trực tiếp qua API
2. **Create Mode** (Tạo sản phẩm mới): Lưu variant vào state (draft), sau đó tạo khi submit sản phẩm

---

## 1. EDIT MODE - Tạo variant khi sản phẩm đã tồn tại

### Luồng hoạt động:

```
1. User click "Thêm biến thể" 
   → openCreateVariantModal()
   → Mở modal với form trống

2. User chọn thuộc tính biến thể
   → VariantAttributesForm component
   → Load attributes từ product_id (getAttributeDefinitions)
   → User chọn Size, Color, etc.

3. User nhập thông tin:
   - SKU (tùy chọn)
   - Điều chỉnh giá
   - Tồn kho
   - Trạng thái
   - Hình ảnh (upload file hoặc URL)

4. User click "Lưu"
   → saveVariant()
   → Upload ảnh (nếu có file)
   → Gọi API: variantService.createVariant(productId, payload)
   → Fetch lại danh sách variants
   → Giữ modal mở để tạo variant tương tự
```

### Code chính:

**Mở modal tạo mới:**
```typescript
const openCreateVariantModal = () => {
  setVariantEditing(null);
  variantForm.resetFields();
  variantImages.reset();
  setVariantModalOpen(true);
};
```

**Lưu variant:**
```typescript
const saveVariant = async (values: any) => {
  // Upload ảnh
  const allVariantImageUrls = await variantImages.processImages();
  
  // Tạo payload
  const payload = {
    variant_attributes: values.variant_attributes,
    price_adjustment: values.price_adjustment ?? 0,
    stock_quantity: values.stock_quantity ?? 0,
    sku: values.sku || null,
    image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
    is_active: values.is_active !== false,
  };
  
  // Gọi API
  await variantService.createVariant(Number(id), payload);
  
  // Fetch lại danh sách
  await fetchVariants();
  
  // Giữ modal mở để tạo variant tương tự
  variantForm.setFieldsValue({ variant_attributes: {} });
  variantImages.reset(allVariantImageUrls);
};
```

### Đặc điểm:
- ✅ Có thể chọn thuộc tính từ dropdown (VariantAttributesForm)
- ✅ Upload ảnh ngay khi lưu
- ✅ Tạo variant trực tiếp vào database
- ✅ Modal vẫn mở sau khi tạo để tạo variant tương tự

---

## 2. CREATE MODE - Tạo variant khi tạo sản phẩm mới

### Luồng hoạt động:

```
1. User đang tạo sản phẩm mới (chưa có product_id)
   → Chọn category_id

2. User click "Thêm biến thể"
   → openCreateVariantDraftModal()
   → Mở modal với form trống

3. User chọn thuộc tính biến thể
   → VariantAttributesFormDraft component
   → Load attributes từ category_id (getAllAttributeDefinitions với category_id)
   → User chọn Size, Color, etc.

4. User nhập thông tin:
   - SKU (tùy chọn)
   - Điều chỉnh giá
   - Tồn kho
   - Trạng thái
   - Hình ảnh (upload file hoặc URL) - Lưu vào state, chưa upload

5. User click "Lưu"
   → saveVariantDraft()
   → Lưu vào state: variantDrafts[]
   → Đóng modal

6. User submit form sản phẩm
   → handleSubmit()
   → Tạo sản phẩm trước → Lấy product_id
   → Loop qua variantDrafts:
      - Upload ảnh (nếu có file)
      - Gọi API: variantService.createVariant(productId, payload)
   → Hoàn tất
```

### Code chính:

**Mở modal tạo draft:**
```typescript
const openCreateVariantDraftModal = () => {
  setVariantDraftEditingIndex(null);
  variantDraftForm.resetFields();
  variantDraftImages.reset();
  setVariantDraftModalOpen(true);
};
```

**Lưu variant draft:**
```typescript
const saveVariantDraft = (values: any) => {
  const variantAttributes = values.variant_attributes || {};
  
  // Lấy URLs và files từ hook
  const variantDraftImageUrls = variantDraftImages.getImageUrls();
  const variantDraftImageFiles = variantDraftImages.getImageFiles();

  const normalized: VariantDraft = {
    variant_attributes: variantAttributes,
    price_adjustment: values.price_adjustment ?? 0,
    stock_quantity: values.stock_quantity ?? 0,
    sku: values.sku || null,
    image_urls: variantDraftImageUrls.length > 0 ? variantDraftImageUrls : undefined,
    imageFiles: variantDraftImageFiles.length > 0 ? variantDraftImageFiles : undefined,
    is_active: values.is_active !== false,
  };

  // Kiểm tra trùng
  const duplicateIndex = variantDrafts.findIndex(...);
  if (duplicateIndex !== -1) {
    message.error('Biến thể này đã tồn tại');
    return;
  }

  // Lưu vào state
  setVariantDrafts([...variantDrafts, normalized]);
};
```

**Tạo variants sau khi tạo sản phẩm:**
```typescript
// Trong handleSubmit(), sau khi tạo sản phẩm thành công
if (createdProductId && variantDrafts.length > 0) {
  for (const v of variantDrafts) {
    // Upload ảnh
    let uploadedVariantImageUrls: string[] = [];
    if (v.imageFiles && v.imageFiles.length > 0) {
      uploadedVariantImageUrls = await uploadMultipleFiles(v.imageFiles);
    }

    const allVariantImageUrls = [
      ...(v.image_urls || []),
      ...uploadedVariantImageUrls
    ];

    // Tạo variant
    await variantService.createVariant(createdProductId, {
      variant_attributes: v.variant_attributes,
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
      sku: v.sku || null,
      image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
      is_active: v.is_active !== false,
    });
  }
}
```

### Đặc điểm:
- ✅ Chọn thuộc tính từ dropdown (VariantAttributesFormDraft) dựa trên category_id
- ✅ Lưu ảnh vào state, chưa upload
- ✅ Lưu variant vào state (draft), chưa tạo trong database
- ✅ Tạo variants sau khi có product_id

---

## 3. Quản lý hình ảnh variant

### Hook: `useVariantImages`

Hook này quản lý tất cả logic xử lý ảnh variant:

```typescript
const variantImages = useVariantImages();

// Các method:
- handleImageUpload: Upload file vào state
- handleImageRemove: Xóa ảnh
- handleImageUrlChange: Thay đổi URL
- handleAddImageUrl: Thêm input URL mới
- getImageFiles: Lấy danh sách files
- getImageUrls: Lấy danh sách URLs
- processImages: Upload files và trả về tất cả URLs
- reset: Reset về trạng thái ban đầu
```

### Cách hoạt động:

**Edit Mode:**
- Upload ảnh ngay khi lưu variant
- `processImages()` upload files → trả về URLs

**Create Mode:**
- Lưu files vào state (chưa upload)
- `getImageFiles()` và `getImageUrls()` để lấy riêng
- Upload sau khi tạo sản phẩm

---

## 4. Validation

### Variant Attributes:
- ✅ Bắt buộc phải có ít nhất 1 thuộc tính
- ✅ Kiểm tra trùng (variant_attributes giống nhau)

### Images:
- ✅ Hỗ trợ upload file hoặc nhập URL
- ✅ Có thể có nhiều ảnh cho 1 variant

---

## 5. Tính năng bổ sung

### Duplicate variant:
- **Edit Mode**: `duplicateVariant()` - Copy variant và mở form
- **Create Mode**: `duplicateVariantDraft()` - Copy draft và mở form

### Edit variant:
- **Edit Mode**: `openEditVariantModal()` - Load dữ liệu variant vào form
- **Create Mode**: `openEditVariantDraftModal()` - Load draft vào form

### Delete variant:
- **Edit Mode**: `deleteVariant()` - Xóa variant từ database
- **Create Mode**: `removeVariantDraft()` - Xóa draft khỏi state

---

## 6. State Management

### Edit Mode:
```typescript
- variants: ProductVariant[] // Variants từ database
- variantModalOpen: boolean
- variantEditing: ProductVariant | null
- variantImages: useVariantImages()
```

### Create Mode:
```typescript
- variantDrafts: VariantDraft[] // Variants tạm trong state
- variantDraftModalOpen: boolean
- variantDraftEditingIndex: number | null
- variantDraftImages: useVariantImages()
```

---

## 7. Components liên quan

1. **VariantAttributesForm**: Chọn thuộc tính trong Edit Mode (cần product_id)
2. **VariantAttributesFormDraft**: Chọn thuộc tính trong Create Mode (cần category_id)
3. **VariantAttributesManager**: Quản lý định nghĩa thuộc tính (chỉ Edit Mode)
4. **useVariantImages**: Hook quản lý ảnh variant

---

## 8. API Endpoints

- `GET /products/:productId/variants` - Lấy variants của sản phẩm
- `POST /products/:productId/variants` - Tạo variant mới
- `PUT /products/variants/:id` - Cập nhật variant
- `DELETE /products/variants/:id` - Xóa variant
- `GET /products/:productId/variant-attributes` - Lấy định nghĩa thuộc tính
- `GET /products/variant-attributes/all?category_id=...` - Lấy attributes theo category
