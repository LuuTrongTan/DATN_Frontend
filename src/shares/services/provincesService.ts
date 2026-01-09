import { apiClient } from '../api';

export interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts?: District[];
}

export interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards?: Ward[];
}

export interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  district_code: number;
}

export interface ProvincesResponse {
  success: boolean;
  message: string;
  data?: Province[];
}

export interface ProvinceResponse {
  success: boolean;
  message: string;
  data?: Province;
}

export interface DistrictsResponse {
  success: boolean;
  message: string;
  data?: District[];
}

export interface DistrictResponse {
  success: boolean;
  message: string;
  data?: District;
}

export interface WardsResponse {
  success: boolean;
  message: string;
  data?: Ward[];
}

export interface WardResponse {
  success: boolean;
  message: string;
  data?: Ward;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data?: any[];
}

export const provincesService = {
  /**
   * Get all provinces (tỉnh/thành phố)
   */
  getProvinces: async (): Promise<ProvincesResponse> => {
    console.log('[provincesService] Calling getProvinces');
    const result = await apiClient.get(`/provinces`);
    console.log('[provincesService] getProvinces result:', result);
    return result;
  },

  /**
   * Get province by code
   * @param code - Mã tỉnh/thành phố
   */
  getProvinceByCode: async (code: number): Promise<ProvinceResponse> => {
    return apiClient.get(`/provinces/${code}`);
  },

  /**
   * Get districts by province code
   * @param provinceCode - Mã tỉnh/thành phố
   */
  getDistricts: async (provinceCode: number): Promise<DistrictsResponse> => {
    console.log('[provincesService] Calling getDistricts with provinceCode:', provinceCode);
    const result = await apiClient.get(`/provinces/${provinceCode}/districts`);
    console.log('[provincesService] getDistricts result:', result);
    return result;
  },

  /**
   * Get district by code
   * @param code - Mã quận/huyện
   */
  getDistrictByCode: async (code: number): Promise<DistrictResponse> => {
    return apiClient.get(`/provinces/districts/${code}`);
  },

  /**
   * Get wards by district code
   * @param districtCode - Mã quận/huyện
   */
  getWards: async (districtCode: number): Promise<WardsResponse> => {
    console.log('[provincesService] Calling getWards with districtCode:', districtCode);
    const result = await apiClient.get(`/provinces/districts/${districtCode}/wards`);
    console.log('[provincesService] getWards result:', result);
    return result;
  },

  /**
   * Get ward by code
   * @param code - Mã phường/xã
   */
  getWardByCode: async (code: number): Promise<WardResponse> => {
    return apiClient.get(`/provinces/wards/${code}`);
  },

  /**
   * Search provinces, districts, wards
   * @param keyword - Từ khóa tìm kiếm
   */
  search: async (keyword: string): Promise<SearchResponse> => {
    return apiClient.get(`/provinces/search?q=${encodeURIComponent(keyword)}`);
  },
};

