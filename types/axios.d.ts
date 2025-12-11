export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
};
