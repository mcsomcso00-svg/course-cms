// 批量匯入：共用型別（client / server 皆可引用，不含任何伺服器依賴）

export type ColType = "string" | "number" | "int" | "date" | "enum";

export interface Column {
  key: string; // 內部欄位名
  header: string; // 範本顯示的中文標題
  required?: boolean;
  type?: ColType; // 預設 string
  options?: { value: string; label: string }[]; // enum 用：label 顯示、value 存入
  example?: string; // 範本「說明」頁的範例
  note?: string; // 額外提示
}

export type RowStatus = "new" | "update" | "error";

export interface PreviewRow {
  rowNo: number; // 對應 Excel 列號（由 2 起）
  status: RowStatus;
  messages: string[]; // 錯誤 / 提示
  display: Record<string, string>; // 每欄顯示值
  data: Record<string, unknown> | null; // 通過驗證後的寫入資料（error 時為 null）
  matchId: string | null; // update 時對應的既有紀錄 id
  dupKey: string | null; // 批次內去重用的鍵（null = 不去重）
}

export interface SectionMeta {
  key: string;
  title: string;
  description: string;
  columns: { key: string; header: string; required?: boolean }[];
}
