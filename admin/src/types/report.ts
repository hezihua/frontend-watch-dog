// 页面信息
interface PageMsg {
  /** 是否是首屏 */
  isFirst?: boolean;
  /** 域名 */
  domain: string;
  /** 网页链接 */
  pageUrl: string;
}

// 页面状态
interface PageStatus {
  /** 页面进入时间 */
  inTime: number;
  /** 离开页面时间 */
  leaveTime: number;
  /** 页面停留时间 */
  residence: number;
}

// 点击事件
interface ClickReportMsg {
  type: 'click';
  clickElement: string;
}

// 性能数据
interface PerformanceReportMsg {
  type: 'performance';
  /** 页面Dns解析时长 */
  dnsTime: number;
  /** 页面TCP链接时长 */
  tcpTime: number;
  /** 页面白屏时间 */
  whiteTime: number;
  /** 首次内容 */
  fcp: number;
  /** 首字节时间 */
  ttfb: number;
  /** 最大内容绘制 */
  lcp: number;
  /** 用户首次与页面交互 */
  fid: number;
  resources: ResourceStatus[];
}

// 资源状态
interface ResourceStatus {
  /** 资源链接 */
  resource: string;
  /** 资源请求耗时 */
  duration: number;
  /** 资源大小 */
  size: number;
  /** 资源类型 */
  type: string;
}

// HTTP 请求
type RequestReportMsg = {
  type: 'request';
  url: string;
  method: string;
  reqHeaders: string;
  reqBody: string;
  status: number;
  requestType: 'done' | 'error' | 'timeout';
  cost: number;
};

// JS 错误
type JsErrorReportMsg = {
  type: 'jsError';
  message: string;
  colno: number;
  lineno: number;
  stack: string;
  filename: string;
};

// 资源加载错误
type LoadResourceErrorReportMsg = {
  type: 'loadResourceError';
  resourceType: string;
  resourceUrl: string;
};

// Promise 拒绝错误
type RejectErrorReportMsg = {
  type: 'rejectError';
  reason: string;
};

// 页面状态上报
interface PageStatusReportMsg extends PageStatus {
  type: 'pageStatus';
}

// User-Agent 信息
interface UaMsg {
  /** 浏览器名称 */
  browserName?: string;
  /** 浏览器版本号 */
  browserVersion?: string;
  /** 浏览器主版本 */
  browserMajor?: string;
  /** 系统名称 */
  osName?: string;
  /** 系统版本号 */
  osVersion?: string;
  /** 设备名称 */
  deviceVendor?: string;
  /** 设备模型 */
  deviceModel?: string;
  ua?: string;
}

// IP 地址信息
interface IpMsg {
  ip?: string;
  province?: string;
  city?: string;
  country?: string;
}

// 上报数据项
export type ReportItem = (
  | PerformanceReportMsg
  | PageStatusReportMsg
  | RequestReportMsg
  | JsErrorReportMsg
  | LoadResourceErrorReportMsg
  | RejectErrorReportMsg
  | ClickReportMsg
) &
  PageMsg & {
    userTimeStamp: number;
    markUserId: string;
    userId: string;
    appId: string;
  } & UaMsg &
  IpMsg;

// 性能查询请求
export interface SearchPerformanceReq {
  from: number;
  size: number;
  pageUrl?: string | undefined;
  beginTime?: Date | undefined;
  endTime?: Date | undefined;
  /** 1:1s以内 2:1~2s 3:2~3s 4:3s以上 */
  whiteTime?: 1 | 2 | 3 | 4 | undefined;
  sorterName: string;
  sorterKey: string;
}

// HTTP 查询请求
export interface SearchHttpReq {
  from: number;
  size: number;
  url?: string | undefined;
  link?: string | undefined;
  beginTime?: Date | undefined;
  endTime?: Date | undefined;
  sorterName: string;
  sorterKey: string;
  requestType?: 'done' | 'error' | string;
}
